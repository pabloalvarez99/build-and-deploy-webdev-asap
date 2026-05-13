import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers'

// GET /api/admin/purchase-orders/monthly-summary?months=6
// Resumen mensual de gasto en compras agrupado por proveedor.
// Solo OCs en status='received' (gastos reales, no borradores cancelados).
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return errorResponse('Unauthorized', 403)

    const months = Math.min(24, Math.max(1, parseInt(request.nextUrl.searchParams.get('months') || '6', 10)))

    const db = await getDb()

    // Compute start date: first day of (current month - (months-1))
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

    const orders = await db.purchase_orders.findMany({
      where: {
        status: 'received',
        invoice_date: { gte: start },
      },
      select: {
        invoice_date: true,
        total_cost: true,
        supplier_id: true,
        suppliers: { select: { name: true } },
      },
    })

    // Build month buckets in order
    const monthKeys: string[] = []
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    // suppliers set (id → name)
    const suppliersMap = new Map<string, string>()
    // bucket: monthKey → { [supplier_id]: total }
    const buckets: Record<string, Record<string, number>> = {}
    for (const m of monthKeys) buckets[m] = {}

    for (const o of orders) {
      if (!o.invoice_date) continue
      const d = new Date(o.invoice_date)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!buckets[key]) continue
      const sid = o.supplier_id
      suppliersMap.set(sid, o.suppliers?.name ?? '—')
      buckets[key][sid] = (buckets[key][sid] || 0) + Number(o.total_cost || 0)
    }

    // Recharts format: rows = [{ month: '2026-05', label: 'May 26', total: N, ['Mediven']: X, ['Global']: Y, ... }]
    const supplierIds = Array.from(suppliersMap.keys())
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const data = monthKeys.map((mk) => {
      const [y, m] = mk.split('-').map((n) => parseInt(n, 10))
      const row: Record<string, string | number> = { month: mk, label: `${monthNames[m - 1]} ${String(y).slice(-2)}` }
      let total = 0
      for (const sid of supplierIds) {
        const name = suppliersMap.get(sid) || sid
        const v = buckets[mk][sid] || 0
        row[name] = v
        total += v
      }
      row.total = total
      return row
    })

    const suppliers = supplierIds.map((sid) => ({ id: sid, name: suppliersMap.get(sid) || sid }))

    return NextResponse.json({ months, data, suppliers })
  } catch (e) {
    console.error('GET /api/admin/purchase-orders/monthly-summary error:', e)
    return errorResponse('Error generando resumen mensual', 500)
  }
}
