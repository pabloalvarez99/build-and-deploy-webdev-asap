import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, name, surname, email, phone, notes, session_id } = body;

    if (!items || items.length === 0) return errorResponse('Cart is empty');
    if (!email || !phone) return errorResponse('Email and phone are required');

    const supabase = getServiceClient();

    // Validate products and calculate total
    let total = 0;
    const orderItems: { product_id: string; product_name: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, price, stock, discount_percent')
        .eq('id', item.product_id)
        .eq('active', true)
        .single();

      if (error || !product) return errorResponse(`Product ${item.product_id} not found`, 404);
      if (product.stock < item.quantity) return errorResponse(`Insufficient stock for ${product.name}`);

      const rawPrice = parseFloat(product.price);
      const disc = product.discount_percent as number | null;
      const price = disc ? Math.ceil(rawPrice * (1 - disc / 100)) : rawPrice;
      total += price * item.quantity;
      orderItems.push({ product_id: product.id, product_name: product.name, quantity: item.quantity, price });
    }

    // Generate 6-digit pickup code
    const pickupCode = String(Math.floor(100000 + Math.random() * 900000));

    // Reservation expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Create order with 'reserved' status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: null,
        status: 'reserved',
        total,
        notes,
        guest_email: email,
        guest_session_id: session_id,
        payment_provider: 'store',
        pickup_code: pickupCode,
        reservation_expires_at: expiresAt,
        customer_phone: phone,
        guest_name: name,
        guest_surname: surname,
      })
      .select('id')
      .single();

    if (orderError) return errorResponse(orderError.message, 500);

    // Create order items
    await supabase.from('order_items').insert(
      orderItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price_at_purchase: item.price,
      }))
    );

    return NextResponse.json({
      order_id: order.id,
      pickup_code: pickupCode,
      expires_at: expiresAt,
      total: total.toString(),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
