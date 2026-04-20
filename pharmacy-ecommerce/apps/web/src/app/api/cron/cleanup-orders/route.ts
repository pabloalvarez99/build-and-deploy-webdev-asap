import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendPickupRejectionEmail } from '@/lib/email'
import { restoreLoyaltyPoints } from '@/lib/loyalty'
import { Resend } from 'resend'

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

  // Notify customers + restore loyalty points for expired reservations (non-blocking)
  for (const order of expiredPickups) {
    if (order.guest_email) {
      sendPickupRejectionEmail({
        to: order.guest_email,
        name: order.guest_name || 'Cliente',
        orderId: order.id,
      }).catch(() => {})
    }
    restoreLoyaltyPoints(order.id).catch(() => {})
  }

  // 3. Expiry alerts — products with batches expiring in < 7 days
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const expiringBatches = await db.product_batches.findMany({
    where: { expiry_date: { gte: now, lte: in7 } },
    include: { products: { select: { name: true } } },
  })

  if (expiringBatches.length > 0) {
    try {
      const alertEmail = await db.admin_settings.findUnique({ where: { key: 'alert_email' } })
      if (alertEmail?.value && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY)
        const list = expiringBatches.map((b) =>
          `• ${b.products.name} — lote ${b.batch_code || 'S/N'} — vence ${new Date(b.expiry_date).toLocaleDateString('es-CL')} (${b.quantity} u.)`
        ).join('\n')
        await resend.emails.send({
          from: 'Tu Farmacia <no-reply@tu-farmacia.cl>',
          to: alertEmail.value,
          subject: `⚠️ ${expiringBatches.length} producto(s) vencen en menos de 7 días`,
          text: `Los siguientes productos vencen próximamente:\n\n${list}\n\nRevisa en: https://tu-farmacia.cl/admin/vencimientos`,
        })
      }
    } catch { /* non-blocking */ }
  }

  const result = {
    cancelled_webpay: cancelledWebpay,
    cancelled_pickups: cancelledPickups,
    expiry_alerts: expiringBatches.length,
    ran_at: now.toISOString(),
  }

  console.log('Cron cleanup-orders:', result)
  return NextResponse.json(result)
}
