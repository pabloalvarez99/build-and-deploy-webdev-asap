import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');

    const db = await getDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Sales per product in the period
    const sales = await db.order_items.groupBy({
      by: ['product_id'],
      where: {
        product_id: { not: null },
        orders: {
          created_at: { gte: cutoff },
          status: { notIn: ['cancelled', 'pending'] },
        },
      },
      _sum: { quantity: true },
      _count: { id: true },
    });

    // Revenue per product
    const revenueRaw = await db.$queryRaw<
      { product_id: string; revenue: number }[]
    >`
      SELECT oi.product_id::text, SUM(oi.quantity * oi.price_at_purchase) AS revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.product_id IS NOT NULL
        AND o.created_at >= ${cutoff}
        AND o.status NOT IN ('cancelled', 'pending')
      GROUP BY oi.product_id
    `;

    const revenueMap = new Map(revenueRaw.map(r => [r.product_id, Number(r.revenue)]));
    const salesMap = new Map(sales.map(s => [s.product_id!, { units: s._sum.quantity ?? 0 }]));

    // All active products
    const products = await db.products.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
        cost_price: true,
        categories: { select: { name: true } },
      },
    });

    // Build ABC data
    const items = products.map(p => {
      const revenue = revenueMap.get(p.id) ?? 0;
      const units = salesMap.get(p.id)?.units ?? 0;
      const stockValue = p.stock * Number(p.price);
      const dailySales = units / days;
      const daysStock = dailySales > 0 ? Math.round(p.stock / dailySales) : null;
      const rotacion = p.stock > 0 && units > 0 ? Math.round((units / days) * 30 * 10) / 10 : 0;

      return {
        id: p.id,
        name: p.name,
        category: p.categories?.name ?? 'Sin categoría',
        revenue,
        units,
        stock: p.stock,
        stock_value: stockValue,
        price: Number(p.price),
        cost_price: p.cost_price ? Number(p.cost_price) : null,
        dias_stock: daysStock,
        rotacion_30d: rotacion,
        clase: 'C' as 'A' | 'B' | 'C',
        revenue_pct: 0,
        cumulative_pct: 0,
      };
    });

    // Sort by revenue desc
    items.sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = items.reduce((s, i) => s + i.revenue, 0);
    let cumulative = 0;

    for (const item of items) {
      item.revenue_pct = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 10000) / 100 : 0;
      cumulative += item.revenue_pct;
      item.cumulative_pct = Math.round(cumulative * 100) / 100;
      if (item.cumulative_pct <= 80) item.clase = 'A';
      else if (item.cumulative_pct <= 95) item.clase = 'B';
      else item.clase = 'C';
    }

    const summary = {
      total_products: items.length,
      clase_a: items.filter(i => i.clase === 'A').length,
      clase_b: items.filter(i => i.clase === 'B').length,
      clase_c: items.filter(i => i.clase === 'C').length,
      total_revenue: totalRevenue,
      days,
    };

    return NextResponse.json({ items, summary });
  } catch (error) {
    console.error('ABC analysis error:', error);
    return errorResponse('Internal error', 500);
  }
}
