import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendBroadcast } from '@/lib/push/broadcast'

// Daily: alerta push si lotes con expiry_date ≤ hoy+30 días y quantity > 0.
// Agrupa por producto (suma quantity de todos los lotes próximos a vencer).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + 30)

  const batches = await db.product_batches.findMany({
    where: {
      quantity: { gt: 0 },
      expiry_date: { lte: cutoff },
    },
    select: {
      id: true,
      batch_code: true,
      expiry_date: true,
      quantity: true,
      product_id: true,
      products: { select: { name: true } },
    },
    orderBy: { expiry_date: 'asc' },
  })

  if (batches.length === 0) {
    return NextResponse.json({ ok: true, alerted: 0, reason: 'no expiring batches' })
  }

  // Group by product
  type Group = { product_id: string; product_name: string; total_qty: number; nearest: Date; lot_count: number; vencidos: number }
  const groups = new Map<string, Group>()
  for (const b of batches) {
    if (!b.product_id || !b.expiry_date) continue
    const exp = new Date(b.expiry_date)
    const g = groups.get(b.product_id)
    const isVencido = exp < today
    if (!g) {
      groups.set(b.product_id, {
        product_id: b.product_id,
        product_name: b.products?.name ?? '—',
        total_qty: b.quantity,
        nearest: exp,
        lot_count: 1,
        vencidos: isVencido ? 1 : 0,
      })
    } else {
      g.total_qty += b.quantity
      g.lot_count++
      if (isVencido) g.vencidos++
      if (exp < g.nearest) g.nearest = exp
    }
  }

  let totalSent = 0
  const details: Array<{ product: string; qty: number; nearest: string; lots: number; vencidos: number; sent: number; failed: number }> = []

  for (const g of Array.from(groups.values())) {
    const nearestStr = g.nearest.toLocaleDateString('es-CL')
    const tag = g.vencidos > 0 ? '⚠️ Vencidos' : '⏰ Vencen pronto'
    const lotsLbl = g.lot_count === 1 ? 'lote' : 'lotes'
    const body = g.vencidos > 0
      ? `${g.product_name} · ${g.vencidos}/${g.lot_count} ${lotsLbl} vencidos · ${g.total_qty} unid. próx ${nearestStr}`
      : `${g.product_name} · ${g.total_qty} unid. en ${g.lot_count} ${lotsLbl} · vence ${nearestStr}`

    const res = await sendBroadcast({
      title: `${tag}: ${g.product_name}`.slice(0, 120),
      body: body.slice(0, 200),
      url: `/admin/vencimientos`,
      tag: `expiry-${g.product_id}`,
    })
    totalSent += res.sent
    details.push({
      product: g.product_name,
      qty: g.total_qty,
      nearest: nearestStr,
      lots: g.lot_count,
      vencidos: g.vencidos,
      sent: res.sent,
      failed: res.failed,
    })
  }

  return NextResponse.json({ ok: true, alerted: groups.size, totalBatches: batches.length, totalSent, details })
}
