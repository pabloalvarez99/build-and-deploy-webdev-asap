import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { getDb } from '@/lib/db';

function getDefaultFrom(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function buildOrderWhere(dateFilter: { gte: Date; lte: Date }) {
  return {
    created_at: dateFilter,
    OR: [
      { status: { in: ['paid', 'processing', 'shipped', 'delivered'] } },
      { status: 'completed', payment_provider: { in: ['pos_cash', 'pos_debit', 'pos_credit'] } },
    ],
  };
}

function computeKpis(orders: { total: any }[]) {
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  return { totalRevenue, totalOrders: orders.length, avgTicket: orders.length > 0 ? totalRevenue / orders.length : 0 };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from') || getDefaultFrom(30);
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

    const db = await getDb();

    const fromDate = new Date(from + 'T00:00:00Z');
    const toDate = new Date(to + 'T23:59:59Z');
    const periodMs = toDate.getTime() - fromDate.getTime();

    // Previous period: same duration ending the day before `from`
    const prevTo = new Date(fromDate.getTime() - 24 * 60 * 60 * 1000);
    const prevFrom = new Date(prevTo.getTime() - periodMs);

    const dateFilter = { gte: fromDate, lte: toDate };
    const prevDateFilter = { gte: prevFrom, lte: prevTo };

    // Fetch both periods in parallel
    const [orders, prevOrders] = await Promise.all([
      db.orders.findMany({
        where: buildOrderWhere(dateFilter),
        select: { id: true, total: true, created_at: true, status: true, payment_provider: true },
      }),
      db.orders.findMany({
        where: buildOrderWhere(prevDateFilter),
        select: { total: true },
      }),
    ]);

    const orderIds = orders.map((o) => o.id);

    // Fetch order items with product + category + cost_price
    const items = orderIds.length > 0
      ? await db.order_items.findMany({
          where: { order_id: { in: orderIds } },
          select: {
            order_id: true,
            product_id: true,
            product_name: true,
            quantity: true,
            price_at_purchase: true,
            products: {
              select: {
                category_id: true,
                cost_price: true,
                categories: { select: { name: true } },
              },
            },
          },
        })
      : [];

    const isPOS = (o: { payment_provider: string | null }) =>
      o.payment_provider?.startsWith('pos_') ?? false;

    // KPIs
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = orders.length;
    const onlineOrders = orders.filter((o) => !isPOS(o));
    const posOrders = orders.filter((o) => isPOS(o));
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Cost & margin (only for items where cost_price is set)
    let totalCost = 0;
    items.forEach((item) => {
      const cp = item.products?.cost_price ? Number(item.products.cost_price) : null;
      if (cp !== null) totalCost += cp * item.quantity;
    });
    const grossMargin = totalRevenue - totalCost;
    const marginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

    // Sales by day (split online vs POS)
    const orderById = Object.fromEntries(orders.map((o) => [o.id, o]));
    const salesByDay: Record<string, { date: string; ventas: number; ordenes: number; ventas_pos: number; ordenes_pos: number }> = {};
    orders.forEach((o) => {
      const day = o.created_at.toISOString().split('T')[0];
      if (!salesByDay[day]) salesByDay[day] = { date: day, ventas: 0, ordenes: 0, ventas_pos: 0, ordenes_pos: 0 };
      if (isPOS(o)) {
        salesByDay[day].ventas_pos += Number(o.total);
        salesByDay[day].ordenes_pos += 1;
      } else {
        salesByDay[day].ventas += Number(o.total);
        salesByDay[day].ordenes += 1;
      }
    });
    const salesByDayArr = Object.values(salesByDay).sort((a, b) => a.date.localeCompare(b.date));

    // Channel breakdown
    const channelBreakdown = {
      online: {
        orders: onlineOrders.length,
        revenue: onlineOrders.reduce((s, o) => s + Number(o.total), 0),
      },
      pos: {
        orders: posOrders.length,
        revenue: posOrders.reduce((s, o) => s + Number(o.total), 0),
        cash: posOrders.filter((o) => o.payment_provider === 'pos_cash').length,
        debit: posOrders.filter((o) => o.payment_provider === 'pos_debit').length,
        credit: posOrders.filter((o) => o.payment_provider === 'pos_credit').length,
      },
    };

    // Top products with margin
    const productMap: Record<string, {
      name: string; units: number; revenue: number; cost: number;
      has_cost: boolean; category: string;
    }> = {};
    items.forEach((item) => {
      const key = item.product_id || item.product_name;
      const cp = item.products?.cost_price ? Number(item.products.cost_price) : null;
      if (!productMap[key]) {
        productMap[key] = {
          name: item.product_name,
          units: 0,
          revenue: 0,
          cost: 0,
          has_cost: cp !== null,
          category: item.products?.categories?.name || 'Sin categoría',
        };
      }
      productMap[key].units += item.quantity;
      productMap[key].revenue += item.quantity * Number(item.price_at_purchase);
      if (cp !== null) {
        productMap[key].cost += cp * item.quantity;
        productMap[key].has_cost = true;
      }
    });
    const topProducts = Object.values(productMap)
      .map((p) => ({
        ...p,
        margin: p.has_cost ? p.revenue - p.cost : null,
        margin_pct: p.has_cost && p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : null,
      }))
      .sort((a, b) => b.units - a.units)
      .slice(0, 20);

    // Top by margin (products with cost_price set)
    const topByMargin = [...topProducts]
      .filter((p) => p.margin !== null)
      .sort((a, b) => (b.margin ?? 0) - (a.margin ?? 0))
      .slice(0, 10);

    // By category
    const categoryMap: Record<string, { name: string; revenue: number; units: number; cost: number }> = {};
    items.forEach((item) => {
      const cat = item.products?.categories?.name || 'Sin categoría';
      const cp = item.products?.cost_price ? Number(item.products.cost_price) : 0;
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, revenue: 0, units: 0, cost: 0 };
      categoryMap[cat].revenue += item.quantity * Number(item.price_at_purchase);
      categoryMap[cat].units += item.quantity;
      categoryMap[cat].cost += cp * item.quantity;
    });
    const byCategory = Object.values(categoryMap)
      .map((c) => ({ ...c, margin: c.revenue - c.cost }))
      .sort((a, b) => b.revenue - a.revenue);

    // Sales by hour of day (aggregated over the whole period, Chile time = UTC-4/-3)
    const salesByHourMap: Record<number, { hour: number; ordenes: number; ventas: number }> = {};
    for (let h = 0; h < 24; h++) salesByHourMap[h] = { hour: h, ordenes: 0, ventas: 0 };
    orders.forEach((o) => {
      // Adjust for Chile Standard Time (UTC-4); simple offset, doesn't need DST accuracy for reporting
      const hourUTC = o.created_at.getUTCHours();
      const hourCL = ((hourUTC - 4) + 24) % 24;
      salesByHourMap[hourCL].ordenes += 1;
      salesByHourMap[hourCL].ventas += Number(o.total);
    });
    const salesByHour = Object.values(salesByHourMap).sort((a, b) => a.hour - b.hour);

    const prevKpis = computeKpis(prevOrders);

    return NextResponse.json({
      kpis: { totalRevenue, totalOrders, avgTicket, totalCost, grossMargin, marginPct },
      prevKpis: { totalRevenue: prevKpis.totalRevenue, totalOrders: prevKpis.totalOrders, avgTicket: prevKpis.avgTicket },
      channelBreakdown,
      salesByDay: salesByDayArr,
      salesByHour,
      topProducts,
      topByMargin,
      byCategory,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
