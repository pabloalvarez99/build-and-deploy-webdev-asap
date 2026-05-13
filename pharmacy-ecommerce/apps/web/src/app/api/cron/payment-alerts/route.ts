import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { sendBroadcast } from '@/lib/push/broadcast'

// Daily: alerta push si OC recibida sin pagar y due_date ≤ hoy+2 días.
// Una notificación por OC vencida/próxima (no agrupada — operador debe ver cada una).
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = await getDb()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + 2)

  const orders = await db.purchase_orders.findMany({
    where: {
      status: 'received',
      paid: false,
      due_date: { lte: cutoff },
    },
    select: {
      id: true,
      invoice_number: true,
      due_date: true,
      total_cost: true,
      suppliers: { select: { name: true } },
    },
    orderBy: { due_date: 'asc' },
  })

  if (orders.length === 0) {
    return NextResponse.json({ ok: true, alerted: 0, reason: 'no due/overdue invoices' })
  }

  let totalSent = 0
  const details: Array<{ invoice: string; supplier: string; due: string; total: number; sent: number; failed: number }> = []

  for (const o of orders) {
    const totalNum = Number(o.total_cost)
    const dueStr = o.due_date ? new Date(o.due_date).toLocaleDateString('es-CL') : '—'
    const isPast = o.due_date && new Date(o.due_date) < today
    const tag = isPast ? '⚠️ Pago vencido' : '⏰ Pago próximo'

    const res = await sendBroadcast({
      title: `${tag}: ${o.suppliers?.name ?? 'Proveedor'}`,
      body: `Factura ${o.invoice_number ?? o.id.slice(0, 8)} · $${totalNum.toLocaleString('es-CL')} · vence ${dueStr}`,
      url: `/admin/compras/${o.id}`,
      tag: `payment-${o.id}`,
    })
    totalSent += res.sent
    details.push({
      invoice: o.invoice_number ?? o.id.slice(0, 8),
      supplier: o.suppliers?.name ?? '—',
      due: dueStr,
      total: totalNum,
      sent: res.sent,
      failed: res.failed,
    })
  }

  return NextResponse.json({ ok: true, alerted: orders.length, totalSent, details })
}
