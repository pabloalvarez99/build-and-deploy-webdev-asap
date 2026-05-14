import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers'

// GET /api/admin/purchase-orders/kpis?months=6
// KPIs adicionales para tab Resumen /admin/compras:
// - draft_over_7d (count + pct sobre draft total)
// - avg_ticket recibidas (últimos N meses)
// - top 5 productos comprados (qty sum + spend sum, últimos N meses, solo received)
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return errorResponse('Unauthorized', 403)

    const months = Math.min(24, Math.max(1, parseInt(request.nextUrl.searchParams.get('months') || '6', 10)))
    const db = await getDb()

    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000)

    // Draft KPIs (no filtra por fecha — todos los drafts vivos)
    const [draftTotal, draftOver7d] = await Promise.all([
      db.purchase_orders.count({ where: { status: 'draft' } }),
      db.purchase_orders.count({ where: { status: 'draft', created_at: { lt: sevenDaysAgo } } }),
    ])

    // Received en ventana: total_cost para avg ticket
    const received = await db.purchase_orders.findMany({
      where: { status: 'received', invoice_date: { gte: start } },
      select: { id: true, total_cost: true },
    })
    const receivedCount = received.length
    const sumTotal = received.reduce((acc, o) => acc + Number(o.total_cost || 0), 0)
    const avgTicket = receivedCount > 0 ? Math.round(sumTotal / receivedCount) : 0

    // Top 5 productos comprados en la ventana — agrupado por product_id
    const receivedIds = received.map((o) => o.id)
    type ItemAgg = { product_id: string; qty: number; spend: number; name: string }
    const topMap = new Map<string, ItemAgg>()
    if (receivedIds.length > 0) {
      const items = await db.purchase_order_items.findMany({
        where: { purchase_order_id: { in: receivedIds }, product_id: { not: null } },
        select: {
          product_id: true,
          quantity: true,
          subtotal: true,
          products: { select: { name: true } },
        },
      })
      for (const it of items) {
        if (!it.product_id) continue
        const cur = topMap.get(it.product_id) ?? {
          product_id: it.product_id,
          qty: 0,
          spend: 0,
          name: it.products?.name ?? '—',
        }
        cur.qty += it.quantity
        cur.spend += Number(it.subtotal || 0)
        topMap.set(it.product_id, cur)
      }
    }
    const topProducts = Array.from(topMap.values())
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5)

    return NextResponse.json({
      months,
      draft: {
        total: draftTotal,
        over_7d: draftOver7d,
        pct_over_7d: draftTotal > 0 ? Math.round((draftOver7d / draftTotal) * 100) : 0,
      },
      avg_ticket: avgTicket,
      received_count: receivedCount,
      top_products: topProducts,
    })
  } catch (e) {
    console.error('GET /api/admin/purchase-orders/kpis error:', e)
    return errorResponse('Error generando KPIs', 500)
  }
}
