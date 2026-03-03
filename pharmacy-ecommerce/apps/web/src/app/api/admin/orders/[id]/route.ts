import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const body = await request.json();
    const supabase = getServiceClient();

    // Handle reservation approve/reject actions
    if (body.action === 'approve_reservation') {
      return await approveReservation(supabase, id);
    }
    if (body.action === 'reject_reservation') {
      return await rejectReservation(supabase, id);
    }

    const validStatuses = ['pending', 'reserved', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      return errorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status: body.status })
      .eq('id', id)
      .select()
      .single();

    if (error) return errorResponse(error.message, 500);
    return NextResponse.json(data);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

async function approveReservation(supabase: ReturnType<typeof getServiceClient>, orderId: string) {
  // 1. Verify order exists and is in 'reserved' status
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) return errorResponse('Order not found', 404);
  if (order.status !== 'reserved') {
    return errorResponse('Only reserved orders can be approved', 400);
  }

  // 2. Get order items
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId);

  if (itemsError) return errorResponse(itemsError.message, 500);

  // 3. Decrement stock for each item
  for (const item of items || []) {
    if (item.product_id) {
      const { error: stockError } = await supabase.rpc('decrement_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      });
      if (stockError) {
        return errorResponse(`Stock insuficiente para uno de los productos: ${stockError.message}`, 400);
      }
    }
  }

  // 4. Update status to 'processing'
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'processing' })
    .eq('id', orderId)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  // Trigger low-stock email alert (non-blocking, best-effort)
  const productIds = (items || []).map((i: { product_id: string | null }) => i.product_id).filter(Boolean) as string[];
  checkAndAlertLowStock(supabase, productIds).catch(() => {});

  return NextResponse.json(data);
}

async function checkAndAlertLowStock(supabase: ReturnType<typeof getServiceClient>, productIds: string[]) {
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
    const { sendLowStockAlert } = await import('@/lib/email');
    await sendLowStockAlert(alertEmail, products as { name: string; stock: number }[], threshold);
  }
}

async function rejectReservation(supabase: ReturnType<typeof getServiceClient>, orderId: string) {
  // 1. Verify order exists and is in 'reserved' status
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) return errorResponse('Order not found', 404);
  if (order.status !== 'reserved') {
    return errorResponse('Only reserved orders can be rejected', 400);
  }

  // 2. Update status to 'cancelled'
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);
  return NextResponse.json(data);
}
