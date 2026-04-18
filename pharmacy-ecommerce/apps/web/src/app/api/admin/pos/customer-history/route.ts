import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const phone = request.nextUrl.searchParams.get('phone')?.replace(/\D/g, '') || '';
    if (phone.length < 4) {
      return NextResponse.json({ found: false });
    }

    const db = await getDb();

    // Find orders matching the phone (last 4+ digits suffix search)
    const orders = await db.orders.findMany({
      where: {
        customer_phone: { endsWith: phone.slice(-8) },
      },
      include: { order_items: { select: { product_name: true, quantity: true } } },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    if (orders.length === 0) {
      return NextResponse.json({ found: false });
    }

    // Derive customer name from most recent order
    const latest = orders[0];
    const name = latest.guest_name
      ? `${latest.guest_name} ${latest.guest_surname || ''}`.trim()
      : null;

    // Find registered user_id from any order with this phone
    const registeredOrder = orders.find((o) => o.user_id !== null);
    const user_id = registeredOrder?.user_id ?? null;

    // Get loyalty points if registered
    let loyalty_points: number | null = null;
    if (user_id) {
      const profile = await db.profiles.findUnique({ where: { id: user_id }, select: { loyalty_points: true } });
      loyalty_points = profile?.loyalty_points ?? 0;
    }

    // Tally top products across all orders
    const productCount: Record<string, { name: string; count: number }> = {};
    for (const order of orders) {
      for (const item of order.order_items) {
        if (!productCount[item.product_name]) {
          productCount[item.product_name] = { name: item.product_name, count: 0 };
        }
        productCount[item.product_name].count += item.quantity;
      }
    }
    const topProducts = Object.values(productCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((p) => p.name);

    // Recent orders summary
    const recentOrders = orders.slice(0, 5).map((o) => ({
      date: o.created_at.toLocaleDateString('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: 'short' }),
      total: Number(o.total),
      items: o.order_items.map((i) => i.product_name).join(', '),
    }));

    return NextResponse.json({
      found: true,
      name,
      user_id,
      loyalty_points,
      visit_count: orders.length,
      top_products: topProducts,
      recent_orders: recentOrders,
    });
  } catch (e) {
    console.error('GET /api/admin/pos/customer-history error:', e);
    return errorResponse('Error al buscar historial', 500);
  }
}
