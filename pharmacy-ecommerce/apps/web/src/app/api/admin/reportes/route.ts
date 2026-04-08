import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { getDb } from '@/lib/db';

function getDefaultFrom(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from') || getDefaultFrom(30);
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

    const db = await getDb();

    // Fetch paid/completed orders in date range
    const orders = await db.orders.findMany({
      where: {
        created_at: {
          gte: new Date(from + 'T00:00:00Z'),
          lte: new Date(to + 'T23:59:59Z'),
        },
        status: { in: ['paid', 'processing', 'shipped', 'delivered'] },
      },
      select: { id: true, total: true, created_at: true, status: true },
    });

    const orderIds = orders.map((o) => o.id);

    // Fetch order items with product + category info
    const items = orderIds.length > 0
      ? await db.order_items.findMany({
          where: { order_id: { in: orderIds } },
          select: {
            product_id: true,
            product_name: true,
            quantity: true,
            price_at_purchase: true,
            products: {
              select: {
                category_id: true,
                categories: { select: { name: true } },
              },
            },
          },
        })
      : [];

    // KPIs
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = orders.length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Sales by day
    const salesByDay: Record<string, { ventas: number; ordenes: number }> = {};
    orders.forEach((o) => {
      const day = o.created_at.toISOString().split('T')[0];
      if (!salesByDay[day]) salesByDay[day] = { ventas: 0, ordenes: 0 };
      salesByDay[day].ventas += Number(o.total);
      salesByDay[day].ordenes += 1;
    });
    const salesByDayArr = Object.entries(salesByDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top products
    const productMap: Record<string, { name: string; units: number; revenue: number; category: string }> = {};
    items.forEach((item) => {
      const key = item.product_id || item.product_name;
      if (!productMap[key]) {
        productMap[key] = {
          name: item.product_name,
          units: 0,
          revenue: 0,
          category: item.products?.categories?.name || 'Sin categoría',
        };
      }
      productMap[key].units += item.quantity;
      productMap[key].revenue += item.quantity * Number(item.price_at_purchase);
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.units - a.units)
      .slice(0, 20);

    // By category
    const categoryMap: Record<string, { name: string; revenue: number; units: number }> = {};
    items.forEach((item) => {
      const cat = item.products?.categories?.name || 'Sin categoría';
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, revenue: 0, units: 0 };
      categoryMap[cat].revenue += item.quantity * Number(item.price_at_purchase);
      categoryMap[cat].units += item.quantity;
    });
    const byCategory = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      kpis: { totalRevenue, totalOrders, avgTicket },
      salesByDay: salesByDayArr,
      topProducts,
      byCategory,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
