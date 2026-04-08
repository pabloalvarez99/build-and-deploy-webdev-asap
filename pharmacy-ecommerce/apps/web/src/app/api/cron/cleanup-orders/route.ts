import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendPickupRejectionEmail } from '@/lib/email'

// Cleans up:
// 1. Abandoned Webpay "pending" orders older than 30 minutes
// 2. Expired store pickup "reserved" orders past reservation_expires_at
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const now = new Date()
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)

  // 1. Cancel abandoned Webpay orders stuck in "pending" for > 30 min
  const { count: cancelledWebpay } = await db.orders.updateMany({
    where: {
      status: 'pending',
      payment_provider: 'webpay',
      created_at: { lt: thirtyMinutesAgo },
    },
    data: { status: 'cancelled' },
  })

  // 2. Fetch expired reservations before cancelling (need emails)
  const expiredPickups = await db.orders.findMany({
    where: {
      status: 'reserved',
      payment_provider: 'store',
      reservation_expires_at: { lt: now },
    },
    select: { id: true, guest_email: true, guest_name: true },
  })

  const { count: cancelledPickups } = await db.orders.updateMany({
    where: {
      status: 'reserved',
      payment_provider: 'store',
      reservation_expires_at: { lt: now },
    },
    data: { status: 'cancelled' },
  })

  // Notify customers whose reservations expired (non-blocking)
  for (const order of expiredPickups) {
    if (order.guest_email) {
      sendPickupRejectionEmail({
        to: order.guest_email,
        name: order.guest_name || 'Cliente',
        orderId: order.id,
      }).catch(() => {})
    }
  }

  const result = {
    cancelled_webpay: cancelledWebpay,
    cancelled_pickups: cancelledPickups,
    ran_at: now.toISOString(),
  }

  console.log('Cron cleanup-orders:', result)
  return NextResponse.json(result)
}
