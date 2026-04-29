import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

type Period = 'today' | 'week' | 'month';

function rangeFor(period: Period): { from: Date; to: Date } {
  const now = new Date();
  if (period === 'today') {
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }
  if (period === 'week') {
    const from = new Date(now);
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from, to: now };
}

const POS_PROVIDERS = ['pos_cash', 'pos_debit', 'pos_credit', 'pos_mixed'];

export async function GET(request: NextRequest) {
  try {
    const owner = await getOwnerUser();
    if (!owner) return errorResponse('Unauthorized', 403);

    const url = new URL(request.url);
    const period = (url.searchParams.get('period') || 'today') as Period;
    const { from, to } = rangeFor(period);

    const db = await getDb();

    const orders = await db.orders.findMany({
      where: {
        created_at: { gte: from, lte: to },
        status: 'completed',
        payment_provider: { in: POS_PROVIDERS },
        sold_by_user_id: { not: null },
      },
      select: {
        id: true,
        total: true,
        created_at: true,
        sold_by_user_id: true,
        sold_by_name: true,
      },
    });

    type Bucket = {
      uid: string;
      name: string;
      revenue: number;
      count: number;
      first_sale: Date | null;
      last_sale: Date | null;
      daily: Record<string, number>; // yyyy-mm-dd → revenue (for sparkline)
    };
    const buckets: Record<string, Bucket> = {};

    for (const o of orders) {
      const uid = o.sold_by_user_id!;
      if (!buckets[uid]) {
        buckets[uid] = {
          uid,
          name: o.sold_by_name || 'Sin nombre',
          revenue: 0,
          count: 0,
          first_sale: null,
          last_sale: null,
          daily: {},
        };
      }
      const b = buckets[uid];
      const total = Number(o.total);
      b.revenue += total;
      b.count += 1;
      if (!b.first_sale || o.created_at < b.first_sale) b.first_sale = o.created_at;
      if (!b.last_sale || o.created_at > b.last_sale) b.last_sale = o.created_at;
      const day = o.created_at.toISOString().slice(0, 10);
      b.daily[day] = (b.daily[day] ?? 0) + total;
    }

    const orderIds = orders.map((o) => o.id);
    let topByUid: Record<string, { name: string; units: number }> = {};
    if (orderIds.length > 0) {
      const items = await db.order_items.findMany({
        where: { order_id: { in: orderIds } },
        select: {
          product_name: true,
          quantity: true,
          orders: { select: { sold_by_user_id: true } },
        },
      });
      const acc: Record<string, Record<string, number>> = {};
      for (const it of items) {
        const uid = it.orders?.sold_by_user_id;
        if (!uid) continue;
        if (!acc[uid]) acc[uid] = {};
        acc[uid][it.product_name] = (acc[uid][it.product_name] ?? 0) + it.quantity;
      }
      for (const [uid, map] of Object.entries(acc)) {
        const top = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
        if (top) topByUid[uid] = { name: top[0], units: top[1] };
      }
    }

    // Build daily revenue series last 7 days (always for sparkline regardless of period)
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push(d.toISOString().slice(0, 10));
    }

    const sparkFrom = new Date(days[0]);
    let sparkOrders: { sold_by_user_id: string | null; total: any; created_at: Date }[] = [];
    if (period !== 'week') {
      sparkOrders = await db.orders.findMany({
        where: {
          created_at: { gte: sparkFrom },
          status: 'completed',
          payment_provider: { in: POS_PROVIDERS },
          sold_by_user_id: { not: null },
        },
        select: { sold_by_user_id: true, total: true, created_at: true },
      });
    } else {
      sparkOrders = orders;
    }
    const sparkByUid: Record<string, Record<string, number>> = {};
    for (const o of sparkOrders) {
      const uid = o.sold_by_user_id!;
      if (!sparkByUid[uid]) sparkByUid[uid] = {};
      const day = o.created_at.toISOString().slice(0, 10);
      sparkByUid[uid][day] = (sparkByUid[uid][day] ?? 0) + Number(o.total);
    }

    const totalRevenue = Object.values(buckets).reduce((s, b) => s + b.revenue, 0);
    const totalCount = Object.values(buckets).reduce((s, b) => s + b.count, 0);

    const sellers = Object.values(buckets)
      .map((b) => ({
        uid: b.uid,
        name: b.name,
        revenue: b.revenue,
        count: b.count,
        avg_ticket: b.count > 0 ? b.revenue / b.count : 0,
        share_pct: totalRevenue > 0 ? (b.revenue / totalRevenue) * 100 : 0,
        first_sale: b.first_sale?.toISOString() ?? null,
        last_sale: b.last_sale?.toISOString() ?? null,
        top_product: topByUid[b.uid] || null,
        sparkline: days.map((d) => sparkByUid[b.uid]?.[d] ?? 0),
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      period,
      from: from.toISOString(),
      to: to.toISOString(),
      totals: {
        revenue: totalRevenue,
        count: totalCount,
        avg_ticket: totalCount > 0 ? totalRevenue / totalCount : 0,
        sellers_active: sellers.length,
      },
      sellers,
      spark_days: days,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
