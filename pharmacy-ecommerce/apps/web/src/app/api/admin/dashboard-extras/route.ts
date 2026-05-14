import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers'

// GET /api/admin/dashboard-extras
// KPIs extras dashboard owner: OCs por pagar, OCs vencidas, lotes próximos a vencer.
export async function GET() {
  try {
    const admin = await getAdminUser()
    if (!admin) return errorResponse('Unauthorized', 403)

    const db = await getDb()
    const now = new Date()
    const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [unpaidPOs, overduePOs, overdueTop, expiringBatches] = await Promise.all([
      db.purchase_orders.findMany({
        where: { status: 'received', paid: false },
        select: { total_cost: true, due_date: true },
      }),
      db.purchase_orders.findMany({
        where: {
          status: 'received',
          paid: false,
          due_date: { lt: today },
        },
        select: { total_cost: true },
      }),
      db.purchase_orders.findMany({
        where: {
          status: 'received',
          paid: false,
          due_date: { lt: today },
        },
        select: {
          id: true,
          invoice_number: true,
          total_cost: true,
          due_date: true,
          suppliers: { select: { name: true } },
        },
        orderBy: { due_date: 'asc' },
        take: 5,
      }),
      db.product_batches.findMany({
        where: {
          expiry_date: { lte: in30d, gte: today },
          quantity: { gt: 0 },
        },
        select: { product_id: true },
      }),
    ])

    const ocsToPay = {
      count: unpaidPOs.length,
      total: unpaidPOs.reduce((s, p) => s + Number(p.total_cost || 0), 0),
    }
    const ocsOverdue = {
      count: overduePOs.length,
      total: overduePOs.reduce((s, p) => s + Number(p.total_cost || 0), 0),
    }
    const distinctProducts = new Set(expiringBatches.map((b) => b.product_id))
    const expiring = {
      count: expiringBatches.length,
      products: distinctProducts.size,
    }

    const overdueTopList = overdueTop.map((p) => {
      const due = p.due_date ? new Date(p.due_date) : null
      const daysOverdue = due ? Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000)) : 0
      return {
        id: p.id,
        invoice_number: p.invoice_number,
        supplier_name: p.suppliers?.name ?? null,
        total: Number(p.total_cost || 0),
        due_date: p.due_date,
        days_overdue: daysOverdue,
      }
    })

    return NextResponse.json({
      ocs_to_pay: ocsToPay,
      ocs_overdue: ocsOverdue,
      overdue_pos_top: overdueTopList,
      expiring_batches: expiring,
    })
  } catch (e) {
    console.error('GET /api/admin/dashboard-extras error:', e)
    return errorResponse('Error obteniendo KPIs extras', 500)
  }
}
