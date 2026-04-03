import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase/api-helpers';
import { sendPickupRejectionEmail } from '@/lib/email';

// Cleans up:
// 1. Abandoned Webpay "pending" orders older than 30 minutes
// 2. Expired store pickup "reserved" orders past reservation_expires_at
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceClient();
  const now = new Date().toISOString();
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  // 1. Cancel abandoned Webpay orders stuck in "pending" for > 30 min
  const { data: abandonedWebpay, error: webpayError } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('status', 'pending')
    .eq('payment_provider', 'webpay')
    .lt('created_at', thirtyMinutesAgo)
    .select('id');

  if (webpayError) {
    console.error('Cleanup webpay error:', webpayError.message);
  }

  // 2. Cancel expired store pickup reservations
  // First fetch orders to get customer emails for notification
  const { data: expiredPickupsRaw } = await supabase
    .from('orders')
    .select('id, guest_email, guest_name')
    .eq('status', 'reserved')
    .eq('payment_provider', 'store')
    .lt('reservation_expires_at', now);

  const { data: expiredPickups, error: pickupError } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('status', 'reserved')
    .eq('payment_provider', 'store')
    .lt('reservation_expires_at', now)
    .select('id');

  if (pickupError) {
    console.error('Cleanup pickup error:', pickupError.message);
  }

  // Notify customers whose reservations expired (non-blocking)
  if (expiredPickupsRaw && expiredPickupsRaw.length > 0) {
    for (const order of expiredPickupsRaw) {
      if (order.guest_email) {
        sendPickupRejectionEmail({
          to: order.guest_email,
          name: order.guest_name || 'Cliente',
          orderId: order.id,
        }).catch(() => {});
      }
    }
  }

  const result = {
    cancelled_webpay: abandonedWebpay?.length ?? 0,
    cancelled_pickups: expiredPickups?.length ?? 0,
    ran_at: now,
  };

  console.log('Cron cleanup-orders:', result);
  return NextResponse.json(result);
}
