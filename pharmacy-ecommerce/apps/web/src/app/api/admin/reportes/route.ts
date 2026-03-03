import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

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

    const supabase = getServiceClient();

    // Fetch paid/completed orders in date range
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total, created_at, status')
      .gte('created_at', from + 'T00:00:00Z')
      .lte('created_at', to + 'T23:59:59Z')
      .in('status', ['paid', 'processing', 'shipped', 'delivered']);

    if (ordersError) return errorResponse(ordersError.message, 500);

    const orderIds = (orders || []).map((o: { id: string }) => o.id);

    // Fetch order items for those orders
    const { data: items, error: itemsError } = orderIds.length > 0
      ? await supabase
          .from('order_items')
          .select(`
            product_id, product_name, quantity, price_at_purchase,
            products:product_id ( category_id, categories:category_id ( name ) )
          `)
          .in('order_id', orderIds)
      : { data: [], error: null };

    if (itemsError) return errorResponse(itemsError.message, 500);

    // KPIs
    const totalRevenue = (orders || []).reduce((sum: number, o: { total: string }) => sum + parseFloat(o.total), 0);
    const totalOrders = (orders || []).length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Sales by day
    const salesByDay: Record<string, { ventas: number; ordenes: number }> = {};
    (orders || []).forEach((o: { id: string; total: string; created_at: string; status: string }) => {
      const day = o.created_at.split('T')[0];
      if (!salesByDay[day]) salesByDay[day] = { ventas: 0, ordenes: 0 };
      salesByDay[day].ventas += parseFloat(o.total);
      salesByDay[day].ordenes += 1;
    });
    const salesByDayArr = Object.entries(salesByDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top products
    const productMap: Record<string, { name: string; units: number; revenue: number; category: string }> = {};
    (items || []).forEach((item: any) => {
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
      productMap[key].revenue += item.quantity * parseFloat(item.price_at_purchase);
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.units - a.units)
      .slice(0, 20);

    // By category
    const categoryMap: Record<string, { name: string; revenue: number; units: number }> = {};
    (items || []).forEach((item: any) => {
      const cat = item.products?.categories?.name || 'Sin categoría';
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, revenue: 0, units: 0 };
      categoryMap[cat].revenue += item.quantity * parseFloat(item.price_at_purchase);
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
