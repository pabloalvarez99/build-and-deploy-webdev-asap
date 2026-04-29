import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const phone = request.nextUrl.searchParams.get('phone')?.replace(/\D/g, '') || '';
    const rutRaw = request.nextUrl.searchParams.get('rut') || '';
    const rut = rutRaw.replace(/[.\s]/g, '').toUpperCase();

    const db = await getDb();

    let user_id: string | null = null;
    let profileName: string | null = null;
    let profilePhone: string | null = null;

    // Lookup by RUT first if provided (most authoritative)
    if (rut.length >= 7) {
      const profile = await db.profiles.findFirst({
        where: { rut: { equals: rut, mode: 'insensitive' } },
        select: { id: true, name: true, phone: true },
      });
      if (profile) {
        user_id = profile.id;
        profileName = profile.name;
        profilePhone = profile.phone;
      }
    }

    if (!user_id && phone.length < 4) {
      return NextResponse.json({ found: false });
    }

    const orders = await db.orders.findMany({
      where: user_id
        ? { OR: [{ user_id }, ...(phone.length >= 4 ? [{ customer_phone: { endsWith: phone.slice(-8) } }] : [])] }
        : { customer_phone: { endsWith: phone.slice(-8) } },
      include: { order_items: { select: { product_name: true, quantity: true } } },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    if (orders.length === 0 && !user_id) {
      return NextResponse.json({ found: false });
    }

    const latest = orders[0];
    const name = profileName
      ?? (latest?.guest_name ? `${latest.guest_name} ${latest.guest_surname || ''}`.trim() : null);

    if (!user_id) {
      const registeredOrder = orders.find((o) => o.user_id !== null);
      user_id = registeredOrder?.user_id ?? null;
    }

    let loyalty_points: number | null = null;
    if (user_id) {
      const profile = await db.profiles.findUnique({ where: { id: user_id }, select: { loyalty_points: true, phone: true } });
      loyalty_points = profile?.loyalty_points ?? 0;
      if (!profilePhone) profilePhone = profile?.phone ?? null;
    }

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

    const recentOrders = orders.slice(0, 5).map((o) => ({
      date: o.created_at.toLocaleDateString('es-CL', { timeZone: 'America/Santiago', day: '2-digit', month: 'short' }),
      total: Number(o.total),
      items: o.order_items.map((i) => i.product_name).join(', '),
    }));

    return NextResponse.json({
      found: true,
      name,
      user_id,
      phone: profilePhone,
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
