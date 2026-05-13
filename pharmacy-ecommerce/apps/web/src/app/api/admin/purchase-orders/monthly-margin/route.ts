import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers'

// GET /api/admin/purchase-orders/monthly-margin?months=6
// Compara ventas (orders paid/completed por created_at) vs costos (OC received por invoice_date)
// y devuelve margen bruto + % por mes.
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return errorResponse('Unauthorized', 403)

    const months = Math.min(24, Math.max(1, parseInt(request.nextUrl.searchParams.get('months') || '6', 10)))

    const db = await getDb()

    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [orders, pos] = await Promise.all([
      db.orders.findMany({
        where: {
          status: { in: ['paid', 'completed'] },
          created_at: { gte: start, lt: end },
        },
        select: { total: true, created_at: true },
      }),
      db.purchase_orders.findMany({
        where: {
          status: 'received',
          invoice_date: { gte: start, lt: end },
        },
        select: { total_cost: true, invoice_date: true },
      }),
    ])

    const monthKeys: string[] = []
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const sales: Record<string, number> = {}
    const costs: Record<string, number> = {}
    for (const m of monthKeys) { sales[m] = 0; costs[m] = 0 }

    for (const o of orders) {
      const d = new Date(o.created_at)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (sales[key] === undefined) continue
      sales[key] += Number(o.total || 0)
    }
    for (const p of pos) {
      if (!p.invoice_date) continue
      const d = new Date(p.invoice_date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (costs[key] === undefined) continue
      costs[key] += Number(p.total_cost || 0)
    }

    const data = monthKeys.map((mk) => {
      const [y, m] = mk.split('-').map((n) => parseInt(n, 10))
      const s = sales[mk]
      const c = costs[mk]
      const margin = s - c
      const pct = s > 0 ? (margin / s) * 100 : 0
      return {
        month: mk,
        label: `${monthNames[m - 1]} ${String(y).slice(-2)}`,
        sales: s,
        costs: c,
        margin,
        margin_pct: pct,
      }
    })

    const totals = data.reduce(
      (acc, r) => ({ sales: acc.sales + r.sales, costs: acc.costs + r.costs }),
      { sales: 0, costs: 0 }
    )
    const totalMargin = totals.sales - totals.costs
    const totalPct = totals.sales > 0 ? (totalMargin / totals.sales) * 100 : 0

    return NextResponse.json({
      months,
      data,
      totals: { sales: totals.sales, costs: totals.costs, margin: totalMargin, margin_pct: totalPct },
    })
  } catch (e) {
    console.error('GET /api/admin/purchase-orders/monthly-margin error:', e)
    return errorResponse('Error generando margen mensual', 500)
  }
}
