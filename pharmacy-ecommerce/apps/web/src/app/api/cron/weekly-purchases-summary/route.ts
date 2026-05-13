import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendWeeklyPurchasesSummary } from '@/lib/email'

// Weekly: lunes 8am Chile (11 UTC). Email owner con resumen semana anterior.
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = await getDb()

    const emailSetting = await db.admin_settings.findUnique({ where: { key: 'alert_email' } })
    const to = emailSetting?.value
    if (!to) {
      return NextResponse.json({ skipped: true, reason: 'no alert_email configured' })
    }

    // Week range: previous Mon 00:00 → previous Sun 23:59 (Chile local approx, calc in UTC)
    const now = new Date()
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    // JS getUTCDay: 0=Sun, 1=Mon, ... 6=Sat. We want last week's Monday.
    const dow = today.getUTCDay()
    const daysSinceMonday = dow === 0 ? 6 : dow - 1
    const thisMonday = new Date(today)
    thisMonday.setUTCDate(thisMonday.getUTCDate() - daysSinceMonday)
    const weekStart = new Date(thisMonday)
    weekStart.setUTCDate(weekStart.getUTCDate() - 7)
    const weekEnd = new Date(thisMonday)
    weekEnd.setUTCMilliseconds(weekEnd.getUTCMilliseconds() - 1)

    // OCs recibidas en la ventana (por updated_at = momento de recepción)
    const orders = await db.purchase_orders.findMany({
      where: {
        status: 'received',
        updated_at: { gte: weekStart, lte: weekEnd },
      },
      select: {
        invoice_number: true,
        invoice_date: true,
        total_cost: true,
        suppliers: { select: { name: true } },
      },
      orderBy: { updated_at: 'desc' },
    })
    const receivedOrders = orders.map((o) => ({
      invoice_number: o.invoice_number,
      supplier_name: o.suppliers?.name ?? '—',
      invoice_date: o.invoice_date,
      total: Number(o.total_cost || 0),
    }))
    const totalReceived = receivedOrders.reduce((s, o) => s + o.total, 0)

    // Lotes con expiry ≤ 60 días
    const cutoff = new Date(today)
    cutoff.setUTCDate(cutoff.getUTCDate() + 60)
    const batches = await db.product_batches.findMany({
      where: { quantity: { gt: 0 }, expiry_date: { lte: cutoff } },
      select: {
        batch_code: true,
        expiry_date: true,
        quantity: true,
        products: { select: { name: true } },
      },
      orderBy: { expiry_date: 'asc' },
    })
    const expiringBatches = batches
      .filter((b) => b.expiry_date)
      .map((b) => ({
        product_name: b.products?.name ?? '—',
        batch_code: b.batch_code,
        expiry_date: b.expiry_date as Date,
        quantity: b.quantity,
      }))

    const pendingFaltas = await db.faltas.count({ where: { status: 'pending' } })

    await sendWeeklyPurchasesSummary({
      to,
      weekStart,
      weekEnd,
      receivedOrders,
      totalReceived,
      expiringBatches,
      pendingFaltas,
    })

    return NextResponse.json({
      ok: true,
      to,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      ordersCount: receivedOrders.length,
      totalReceived,
      expiringCount: expiringBatches.length,
      pendingFaltas,
    })
  } catch (e) {
    console.error('GET /api/cron/weekly-purchases-summary error:', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'unknown' }, { status: 500 })
  }
}
