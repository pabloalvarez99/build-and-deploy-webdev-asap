import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { getDb } from '@/lib/db';

/**
 * GET /api/admin/reposicion?target_days=30&threshold_days=14
 * Returns products that need restocking based on sales velocity.
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = request.nextUrl;
    const targetDays = parseInt(searchParams.get('target_days') ?? '30');
    const thresholdDays = parseInt(searchParams.get('threshold_days') ?? '14');

    const db = await getDb();

    // Get all active products with stock info
    const products = await db.products.findMany({
      where: { active: true },
      select: {
        id: true, name: true, stock: true, cost_price: true,
        category_id: true, image_url: true,
        categories: { select: { name: true } },
        supplier_product_mappings: {
          select: {
            suppliers: { select: { id: true, name: true } },
          },
          take: 1,
        },
      },
    });

    // 30-day sales velocity
    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() - 30);

    const salesData = await db.order_items.groupBy({
      by: ['product_id'],
      where: {
        product_id: { not: null },
        orders: { created_at: { gte: cutoff30 }, status: { notIn: ['cancelled', 'pending', 'refunded'] } },
      },
      _sum: { quantity: true },
    });

    const salesMap = new Map<string, number>();
    for (const s of salesData) {
      if (s.product_id) salesMap.set(s.product_id, s._sum.quantity ?? 0);
    }

    // Also count from stock_movements reason='ventas_historicas'
    const historical = await db.stock_movements.findMany({
      where: { reason: 'ventas_historicas', delta: { lt: 0 }, product_id: { not: null } },
      select: { product_id: true, delta: true },
    });
    for (const m of historical) {
      if (!m.product_id) continue;
      salesMap.set(m.product_id, (salesMap.get(m.product_id) ?? 0) + Math.abs(m.delta));
    }

    type Suggestion = {
      id: string; name: string; stock: number; units_sold_30d: number;
      avg_daily_units: number; dias_inventario: number | null; suggested_qty: number;
      cost_price: number | null; estimated_cost: number | null; category: string;
      image_url: string | null; urgency: 'critico' | 'alto' | 'medio';
      supplier: { id: string; name: string } | null;
    };
    const suggestions: Suggestion[] = [];
    for (const p of products) {
      const unitsSold30d = salesMap.get(p.id) ?? 0;
      const avgDailyUnits = unitsSold30d / 30;
      const diasInventario = avgDailyUnits > 0 ? Math.round(p.stock / avgDailyUnits) : null;
      const isOutOfStock = p.stock === 0;
      const isLowStock = diasInventario !== null && diasInventario <= thresholdDays;

      if (!isOutOfStock && !isLowStock) continue;

      // Suggested order: enough for targetDays of sales (minus current stock)
      const suggestedQty = avgDailyUnits > 0
        ? Math.max(1, Math.ceil(avgDailyUnits * targetDays - p.stock))
        : (isOutOfStock ? 10 : 5); // fallback for products with no sales history

      const urgency = isOutOfStock ? 'critico'
        : diasInventario !== null && diasInventario <= 3 ? 'critico'
        : diasInventario !== null && diasInventario <= 7 ? 'alto'
        : 'medio';

      suggestions.push({
        id: p.id,
        name: p.name,
        stock: p.stock,
        units_sold_30d: unitsSold30d,
        avg_daily_units: Math.round(avgDailyUnits * 10) / 10,
        dias_inventario: diasInventario,
        suggested_qty: suggestedQty,
        cost_price: p.cost_price ? Number(p.cost_price) : null,
        estimated_cost: p.cost_price ? suggestedQty * Number(p.cost_price) : null,
        category: p.categories?.name ?? 'Sin categoría',
        image_url: p.image_url,
        urgency,
        supplier: p.supplier_product_mappings[0]?.suppliers ?? null,
      });
    }

    // Sort: critico first, then by dias_inventario asc (nulls last)
    suggestions.sort((a, b) => {
      const urgencyOrder = { critico: 0, alto: 1, medio: 2 };
      const ua = urgencyOrder[a.urgency as keyof typeof urgencyOrder];
      const ub = urgencyOrder[b.urgency as keyof typeof urgencyOrder];
      if (ua !== ub) return ua - ub;
      const da = a.dias_inventario ?? 9999;
      const db2 = b.dias_inventario ?? 9999;
      return da - db2;
    });

    // Get suppliers for filter
    const suppliers = await db.suppliers.findMany({
      where: { active: true },
      select: { id: true, name: true, contact_email: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      suggestions,
      suppliers,
      meta: {
        total: suggestions.length,
        critico: suggestions.filter(s => s.urgency === 'critico').length,
        alto: suggestions.filter(s => s.urgency === 'alto').length,
        medio: suggestions.filter(s => s.urgency === 'medio').length,
        total_estimated_cost: suggestions.reduce((s, p) => s + (p.estimated_cost ?? 0), 0),
      },
    });
  } catch (e) {
    console.error('reposicion GET error:', e);
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
}

/**
 * POST /api/admin/reposicion
 * action: 'create_po' — creates a purchase order from selected items
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { supplier_id, items } = await request.json();
    // items: [{ product_id, product_name, quantity, unit_cost }]

    if (!supplier_id) return errorResponse('supplier_id requerido', 400);
    if (!Array.isArray(items) || items.length === 0) return errorResponse('items requerido', 400);

    const db = await getDb();

    const totalCost = items.reduce((s: number, i: { quantity: number; unit_cost: number }) =>
      s + (i.quantity * (i.unit_cost ?? 0)), 0);

    const po = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      const created = await tx.purchase_orders.create({
        data: {
          supplier_id,
          status: 'draft',
          total_cost: totalCost,
          notes: 'Creada desde sugerencias de reposición',
          created_by: 'admin',
        },
      });

      await tx.purchase_order_items.createMany({
        data: items.map((i: { product_id: string; product_name?: string; quantity: number; unit_cost: number }) => ({
          purchase_order_id: created.id,
          product_id: i.product_id || null,
          product_name_invoice: i.product_name ?? null,
          quantity: i.quantity,
          unit_cost: i.unit_cost ?? 0,
          subtotal: i.quantity * (i.unit_cost ?? 0),
        })),
      });

      return created;
    });

    return NextResponse.json({ success: true, po_id: po.id });
  } catch (e) {
    console.error('reposicion POST error:', e);
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
}
