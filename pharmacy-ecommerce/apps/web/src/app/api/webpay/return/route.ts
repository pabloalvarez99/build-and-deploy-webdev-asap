import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/api-helpers';
import { webpayTransaction } from '@/lib/transbank';
import { sendWebpayConfirmation, sendLowStockAlert } from '@/lib/email';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

// Transbank may redirect via GET (token in query params) or POST (token in form body)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenWs = searchParams.get('token_ws');
  const tbkToken = searchParams.get('TBK_TOKEN');
  return handleReturn(tokenWs, tbkToken);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const tokenWs = formData.get('token_ws') as string | null;
    const tbkToken = formData.get('TBK_TOKEN') as string | null;
    return handleReturn(tokenWs, tbkToken);
  } catch {
    return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=internal`, { status: 303 });
  }
}

async function handleReturn(tokenWs: string | null, tbkToken: string | null) {
  try {

    // User cancelled payment — Transbank sends TBK_TOKEN instead of token_ws
    if (tbkToken && !tokenWs) {
      return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=cancelled&token=${tbkToken}`, { status: 303 });
    }

    // Form error (browser closed/recovered) — both tokens present, do NOT commit
    if (tbkToken && tokenWs) {
      return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=cancelled&token=${tbkToken}`, { status: 303 });
    }

    if (!tokenWs) {
      return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=no_token`, { status: 303 });
    }

    // Commit transaction with Transbank
    const result = await webpayTransaction.commit(tokenWs);

    // response_code 0 = approved
    if (result.response_code !== 0) {
      return NextResponse.redirect(
        `${BASE_URL}/checkout/webpay/error?reason=rejected&code=${result.response_code}&token=${tokenWs}`,
        { status: 303 }
      );
    }

    const supabase = getServiceClient();

    // Find order by buyOrder (UUID without dashes, first 26 chars)
    const buyOrderPrefix = result.buy_order as string;

    // Reconstruct UUID from buy_order prefix: add dashes back
    // Format: 8-4-4-4-12 → we stored first 26 chars of uuid without dashes (32 chars without dashes)
    // So we match orders where replace(id::text, '-', '') starts with buyOrderPrefix
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total, guest_email, guest_name, guest_surname')
      .eq('payment_provider', 'webpay')
      .eq('status', 'pending');

    const order = orders?.find(
      (o: { id: string; total: number; guest_email: string; guest_name: string; guest_surname: string | null }) =>
        o.id.replace(/-/g, '').startsWith(buyOrderPrefix)
    );

    if (!order) {
      return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=order_not_found`, { status: 303 });
    }

    // Update order to paid
    await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', order.id);

    // Deduct stock for each order item
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, product_name, quantity, price_at_purchase')
      .eq('order_id', order.id);

    if (orderItems) {
      for (const item of orderItems) {
        await supabase.rpc('decrement_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });
      }
    }

    // Send confirmation email (non-blocking)
    if (order.guest_email) {
      sendWebpayConfirmation({
        to: order.guest_email,
        name: order.guest_name || 'Cliente',
        orderId: order.id,
        total: Number(order.total),
        items: (orderItems || []).map((i: { product_name: string; quantity: number; price_at_purchase: string }) => ({
          product_name: i.product_name,
          quantity: i.quantity,
          price_at_purchase: i.price_at_purchase,
        })),
      }).catch(() => {});
    }

    // Low-stock alert (non-blocking)
    if (orderItems && orderItems.length > 0) {
      checkLowStock(supabase, orderItems.map((i: { product_id: string }) => i.product_id)).catch(() => {});
    }

    const fullName = [order.guest_name, order.guest_surname].filter(Boolean).join(' ');
    return NextResponse.redirect(
      `${BASE_URL}/checkout/webpay/success?order_id=${order.id}&total=${order.total}&name=${encodeURIComponent(fullName)}&token=${tokenWs}`,
      { status: 303 }
    );
  } catch (error) {
    console.error('Webpay return error:', error);
    return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=internal`, { status: 303 });
  }
}

async function checkLowStock(supabase: ReturnType<typeof getServiceClient>, productIds: string[]) {
  if (productIds.length === 0) return;
  const { data: settings } = await supabase.from('admin_settings').select('key, value');
  const settingsMap = Object.fromEntries(
    (settings || []).map((s: { key: string; value: string }) => [s.key, s.value])
  );
  const threshold = parseInt(settingsMap.low_stock_threshold || '10');
  const alertEmail = settingsMap.alert_email;
  if (!alertEmail) return;
  const { data: products } = await supabase
    .from('products')
    .select('name, stock')
    .in('id', productIds)
    .lte('stock', threshold);
  if (products && products.length > 0) {
    await sendLowStockAlert(alertEmail, products as { name: string; stock: number }[], threshold);
  }
}
