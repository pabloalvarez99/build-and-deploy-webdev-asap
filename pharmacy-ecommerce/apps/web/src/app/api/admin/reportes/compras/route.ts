import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

/**
 * GET /api/admin/reportes/compras?from=YYYY-MM-DD&to=YYYY-MM-DD
 * Retorna analytics de órdenes de compra para el panel de reportes.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from') || (() => {
      const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
    })();
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

    const fromDate = new Date(from + 'T00:00:00.000Z');
    const toDate = new Date(to + 'T23:59:59.999Z');

    const db = await getDb();

    // All POs in period
    const pos = await db.purchase_orders.findMany({
      where: { created_at: { gte: fromDate, lte: toDate } },
      select: {
        id: true,
        status: true,
        total_cost: true,
        created_at: true,
        suppliers: { select: { id: true, name: true } },
        items: {
          select: { quantity: true, unit_cost: true, products: { select: { name: true, id: true } } },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    // KPIs
    const receivedPOs = pos.filter(p => p.status === 'received');
    const totalSpend = receivedPOs.reduce((s, p) => s + Number(p.total_cost ?? 0), 0);
    const pendingSpend = pos.filter(p => ['ordered', 'pending'].includes(p.status))
      .reduce((s, p) => s + Number(p.total_cost ?? 0), 0);

    const statusCount: Record<string, number> = {};
    for (const po of pos) {
      statusCount[po.status] = (statusCount[po.status] ?? 0) + 1;
    }

    // Spend by supplier (received POs only)
    const supplierSpend: Record<string, { name: string; spend: number; po_count: number }> = {};
    for (const po of pos) {
      if (!po.suppliers) continue;
      const sid = po.suppliers.id;
      if (!supplierSpend[sid]) supplierSpend[sid] = { name: po.suppliers.name, spend: 0, po_count: 0 };
      supplierSpend[sid].po_count++;
      if (po.status === 'received') {
        supplierSpend[sid].spend += Number(po.total_cost ?? 0);
      }
    }
    const bySupplier = Object.values(supplierSpend)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);

    // Top purchased products (by units ordered, received POs)
    const productUnits: Record<string, { name: string; units: number; cost: number }> = {};
    for (const po of receivedPOs) {
      for (const item of po.items) {
        if (!item.products) continue;
        const pid = item.products.id;
        if (!productUnits[pid]) productUnits[pid] = { name: item.products.name, units: 0, cost: 0 };
        productUnits[pid].units += item.quantity;
        productUnits[pid].cost += item.quantity * Number(item.unit_cost ?? 0);
      }
    }
    const topProducts = Object.values(productUnits)
      .sort((a, b) => b.units - a.units)
      .slice(0, 10);

    // POs by week (for trend chart)
    const weekMap: Record<string, { week: string; po_count: number; spend: number }> = {};
    for (const po of pos) {
      const d = new Date(po.created_at);
      // ISO week start (Monday)
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - day + 1);
      const weekKey = d.toISOString().split('T')[0];
      if (!weekMap[weekKey]) weekMap[weekKey] = { week: weekKey, po_count: 0, spend: 0 };
      weekMap[weekKey].po_count++;
      if (po.status === 'received') weekMap[weekKey].spend += Number(po.total_cost ?? 0);
    }
    const byWeek = Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week));

    return NextResponse.json({
      kpis: {
        total_pos: pos.length,
        received_pos: receivedPOs.length,
        total_spend: totalSpend,
        pending_spend: pendingSpend,
        avg_po_value: receivedPOs.length > 0 ? totalSpend / receivedPOs.length : 0,
      },
      by_status: statusCount,
      by_supplier: bySupplier,
      top_products: topProducts,
      by_week: byWeek,
    });
  } catch (e) {
    console.error('reportes/compras error:', e);
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
}
