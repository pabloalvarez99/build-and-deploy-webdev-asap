import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/api-helpers';

const MP_API = 'https://api.mercadopago.com';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Only process payment events
    if (payload.type !== 'payment') {
      return NextResponse.json({ received: true });
    }

    const paymentId = payload.data?.id;
    if (!paymentId) return NextResponse.json({ received: true });

    const supabase = getServiceClient();

    // Idempotency check
    const { data: existing } = await supabase
      .from('orders')
      .select('id')
      .eq('mercadopago_payment_id', String(paymentId))
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true, already_processed: true });
    }

    // Get payment details from MercadoPago
    const mpResponse = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
      },
    });

    if (!mpResponse.ok) {
      console.error('Failed to get payment from MercadoPago:', await mpResponse.text());
      return NextResponse.json({ error: 'Failed to get payment' }, { status: 500 });
    }

    const payment = await mpResponse.json();
    const orderId = payment.external_reference;
    if (!orderId) return NextResponse.json({ received: true });

    // Get current order status
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (!currentOrder) {
      console.error('Order not found:', orderId);
      return NextResponse.json({ received: true });
    }

    // Map MercadoPago status to our status
    let newStatus: string;
    switch (payment.status) {
      case 'approved':
        newStatus = 'paid';
        break;
      case 'pending':
      case 'in_process':
        newStatus = 'pending';
        break;
      case 'rejected':
      case 'cancelled':
      case 'refunded':
      case 'charged_back':
        newStatus = 'cancelled';
        break;
      default:
        return NextResponse.json({ received: true });
    }

    // Update order status and payment ID
    await supabase
      .from('orders')
      .update({
        status: newStatus,
        mercadopago_payment_id: String(payment.id),
      })
      .eq('id', orderId);

    // Reduce stock only if: new status is "paid" AND previous status was "pending"
    if (newStatus === 'paid' && currentOrder.status === 'pending') {
      const { data: items } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (items) {
        for (const item of items) {
          if (item.product_id) {
            await supabase.rpc('decrement_stock', {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true, status: newStatus });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
