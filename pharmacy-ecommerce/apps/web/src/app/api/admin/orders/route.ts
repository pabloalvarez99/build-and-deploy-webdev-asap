import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const channel = searchParams.get('channel'); // 'pos' | 'online'
    const offset = (page - 1) * limit;

    const db = await getDb();

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (channel === 'pos') {
      where.payment_provider = { in: ['pos_cash', 'pos_debit', 'pos_credit'] };
    } else if (channel === 'online') {
      where.payment_provider = { notIn: ['pos_cash', 'pos_debit', 'pos_credit'] };
    }

    const [orders, total] = await Promise.all([
      db.orders.findMany({
        where,
        include: { order_items: true },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      db.orders.count({ where }),
    ]);

    const serialized = orders.map((order) => ({
      ...order,
      total: order.total.toString(),
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString(),
      reservation_expires_at: order.reservation_expires_at
        ? order.reservation_expires_at.toISOString()
        : null,
      order_items: order.order_items.map((item) => ({
        ...item,
        price_at_purchase: item.price_at_purchase.toString(),
      })),
    }));

    return NextResponse.json({
      orders: serialized,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
