import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();
    const { searchParams } = request.nextUrl;
    const filter = searchParams.get('filter'); // 'low' | 'out' | null (all)
    const search = searchParams.get('search') || '';

    // Fetch settings for low stock threshold
    const settings = await db.admin_settings.findMany({ select: { key: true, value: true } });
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const threshold = parseInt(settingsMap.low_stock_threshold || '10');

    const where: Record<string, unknown> = { active: true };
    if (filter === 'low') {
      where.stock = { gt: 0, lte: threshold };
    } else if (filter === 'out') {
      where.stock = 0;
    } else if (filter === 'slow') {
      // Products with stock > 0 but no sales in the last 60 days
      where.stock = { gt: 0 };
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 60);
      const activeSoldIds = await db.order_items.findMany({
        where: {
          product_id: { not: null },
          orders: {
            created_at: { gte: cutoff },
            status: { notIn: ['cancelled', 'pending'] },
          },
        },
        select: { product_id: true },
        distinct: ['product_id'],
      });
      const soldIds = activeSoldIds.map((i) => i.product_id).filter(Boolean) as string[];
      where.id = soldIds.length > 0 ? { notIn: soldIds } : undefined;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const products = await db.products.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        stock: true,
        price: true,
        cost_price: true,
        categories: { select: { name: true } },
        supplier_product_mappings: {
          take: 1,
          select: {
            supplier_code: true,
            suppliers: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { stock: 'asc' },
    });

    // Sales velocity: units sold per product in the last 30 days (non-cancelled)
    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() - 30);
    const salesData = await db.order_items.groupBy({
      by: ['product_id'],
      where: {
        product_id: { not: null },
        orders: {
          created_at: { gte: cutoff30 },
          status: { notIn: ['cancelled', 'pending'] },
        },
      },
      _sum: { quantity: true },
    });
    const salesMap = new Map<string, number>();
    for (const s of salesData) {
      if (s.product_id) salesMap.set(s.product_id, s._sum.quantity ?? 0);
    }

    let totalRetailValue = 0;
    let totalCostValue = 0;
    let productsWithCost = 0;

    const items = products.map((p) => {
      const price = Number(p.price);
      const costRaw = p.cost_price != null ? Number(p.cost_price) : null;
      const cost = costRaw != null && costRaw > 0 ? costRaw : null;
      const retailValue = price * p.stock;
      const costValue = cost != null ? cost * p.stock : null;

      totalRetailValue += retailValue;
      if (costValue != null) {
        totalCostValue += costValue;
        productsWithCost++;
      }

      const mapping = p.supplier_product_mappings[0];

      // Days of inventory at current sales rate (30-day avg)
      const unitsSold30d = salesMap.get(p.id) ?? 0;
      const avgDailyUnits = unitsSold30d / 30;
      const dias_inventario =
        p.stock > 0 && avgDailyUnits > 0 ? Math.round(p.stock / avgDailyUnits) : null;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        stock: p.stock,
        price,
        cost_price: cost,
        retail_value: retailValue,
        cost_value: costValue,
        margin_pct: cost != null && price > 0 ? ((price - cost) / price) * 100 : null,
        category: p.categories?.name ?? 'Sin categoría',
        low_stock: p.stock <= threshold,
        supplier: mapping?.suppliers
          ? { id: mapping.suppliers.id, name: mapping.suppliers.name, code: mapping.supplier_code }
          : null,
        dias_inventario,
        units_sold_30d: unitsSold30d,
      };
    });

    const grossMarginValue = totalRetailValue - totalCostValue;
    const marginPct = totalRetailValue > 0 ? (grossMarginValue / totalRetailValue) * 100 : 0;

    return NextResponse.json({
      summary: {
        total_products: products.length,
        products_with_cost: productsWithCost,
        total_retail_value: totalRetailValue,
        total_cost_value: totalCostValue,
        gross_margin_value: grossMarginValue,
        margin_pct: marginPct,
        low_stock_threshold: threshold,
      },
      items,
    });
  } catch (error) {
    console.error('Inventory error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
