import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

const MP_API = 'https://api.mercadopago.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, name, surname, email, shipping_address, notes, session_id } = body;

    if (!items || items.length === 0) return errorResponse('Cart is empty');
    if (!email) return errorResponse('Email is required');

    const supabase = getServiceClient();

    // Validate products and calculate total
    let total = 0;
    const mpItems: any[] = [];
    const orderItems: { product_id: string; product_name: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const { data: product, error } = await supabase
        .from('products')
        .select('id, name, price, stock, description, category_id, discount_percent')
        .eq('id', item.product_id)
        .eq('active', true)
        .single();

      if (error || !product) return errorResponse(`Product ${item.product_id} not found`, 404);
      if (product.stock < item.quantity) return errorResponse(`Insufficient stock for ${product.name}`);

      const rawPrice = parseFloat(product.price);
      const disc = product.discount_percent as number | null;
      const price = disc ? Math.ceil(rawPrice * (1 - disc / 100)) : rawPrice;
      total += price * item.quantity;

      mpItems.push({
        id: product.id,
        title: product.name.substring(0, 256),
        quantity: item.quantity,
        unit_price: Math.ceil(price),
        currency_id: 'CLP',
      });

      orderItems.push({ product_id: product.id, product_name: product.name, quantity: item.quantity, price });
    }

    // Create guest order (no user_id)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: null,
        status: 'pending',
        total,
        shipping_address,
        notes,
        guest_email: email,
        guest_name: name,
        guest_surname: surname,
        guest_session_id: session_id,
        payment_provider: 'mercadopago',
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

    // Create MercadoPago preference
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim().replace(/\/+$/, '');
    const isLocalhost = siteUrl.includes('localhost');

    const preference = {
      items: mpItems,
      back_urls: {
        success: `${siteUrl}/checkout/success?order_id=${order.id}`,
        failure: `${siteUrl}/checkout/failure?order_id=${order.id}`,
        pending: `${siteUrl}/checkout/pending?order_id=${order.id}`,
      },
      auto_return: isLocalhost ? undefined : 'approved',
      external_reference: order.id,
      notification_url: `${siteUrl}/api/webhook/mercadopago`,
      payer: { email, name, surname },
      statement_descriptor: 'Tu Farmacia',
    };

    const mpResponse = await fetch(`${MP_API}/checkout/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    if (!mpResponse.ok) {
      const mpError = await mpResponse.text();
      console.error('MercadoPago preference error:', mpError, 'back_urls:', preference.back_urls);
      return errorResponse(`MercadoPago error: ${mpError}`, 500);
    }

    const mpData = await mpResponse.json();
    const isTestToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-');
    const initPoint = isTestToken
      ? mpData.sandbox_init_point || mpData.init_point
      : mpData.init_point;

    // Update order with preference ID
    await supabase
      .from('orders')
      .update({ mercadopago_preference_id: mpData.id })
      .eq('id', order.id);

    return NextResponse.json({
      order_id: order.id,
      init_point: initPoint,
      preference_id: mpData.id,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
