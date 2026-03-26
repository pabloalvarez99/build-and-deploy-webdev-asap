import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/api-helpers';
import { webpayTransaction } from '@/lib/transbank';

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
      .select('id, total, guest_email, guest_name')
      .eq('payment_provider', 'webpay')
      .eq('status', 'pending');

    const order = orders?.find(
      (o: { id: string; total: number; guest_email: string; guest_name: string }) =>
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
      .select('product_id, quantity')
      .eq('order_id', order.id);

    if (orderItems) {
      for (const item of orderItems) {
        await supabase.rpc('decrement_stock', {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });
      }
    }

    return NextResponse.redirect(
      `${BASE_URL}/checkout/webpay/success?order_id=${order.id}&total=${order.total}&name=${encodeURIComponent(order.guest_name || '')}&token=${tokenWs}`,
      { status: 303 }
    );
  } catch (error) {
    console.error('Webpay return error:', error);
    return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=internal`, { status: 303 });
  }
}
