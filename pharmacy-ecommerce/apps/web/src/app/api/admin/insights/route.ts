import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export const dynamic = 'force-dynamic';

interface Insight {
  type: 'anomaly_drop' | 'anomaly_rise' | 'frozen_capital' | 'customer_at_risk' | 'expiry_no_discount' | 'trending' | 'no_sales';
  severity: 'critical' | 'warning' | 'info' | 'positive';
  title: string;
  detail: string;
  value?: string | number;
  href?: string;
  meta?: Record<string, unknown>;
}

export async function GET() {
  try {
    const owner = await getOwnerUser();
    if (!owner) return errorResponse('Unauthorized', 403);
    const db = await getDb();

    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const start7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const start4w = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
    const start8w = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);
    const start30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const in60d = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const insights: Insight[] = [];

    // 1. Anomalías por producto: ventas última semana vs prom 4 semanas previas
    const salesThisWeek = await db.order_items.groupBy({
      by: ['product_id', 'product_name'],
      where: {
        orders: { status: { in: ['paid', 'completed'] }, created_at: { gte: start7d } },
        product_id: { not: null },
      },
      _sum: { quantity: true },
    });

    const salesPrev4w = await db.order_items.groupBy({
      by: ['product_id'],
      where: {
        orders: { status: { in: ['paid', 'completed'] }, created_at: { gte: start4w, lt: start7d } },
        product_id: { not: null },
      },
      _sum: { quantity: true },
    });

    const prevMap = new Map(salesPrev4w.map((s) => [s.product_id, (s._sum.quantity ?? 0) / 3]));

    for (const cur of salesThisWeek) {
      const curQty = cur._sum.quantity ?? 0;
      const prevAvg = prevMap.get(cur.product_id) ?? 0;
      if (prevAvg < 5) continue;
      const ratio = curQty / prevAvg;
      if (ratio >= 1.6 && curQty >= 10) {
        insights.push({
          type: 'trending',
          severity: 'positive',
          title: `${cur.product_name} en alza`,
          detail: `Vendiste ${curQty} u esta semana (vs ~${prevAvg.toFixed(0)} u prom). +${((ratio - 1) * 100).toFixed(0)}%.`,
          value: `+${((ratio - 1) * 100).toFixed(0)}%`,
          href: cur.product_id ? `/admin/productos?focus=${cur.product_id}` : undefined,
        });
      } else if (ratio <= 0.4) {
        insights.push({
          type: 'anomaly_drop',
          severity: 'warning',
          title: `${cur.product_name} cayó fuerte`,
          detail: `Solo ${curQty} u esta semana (vs ~${prevAvg.toFixed(0)} u prom). -${((1 - ratio) * 100).toFixed(0)}%.`,
          value: `-${((1 - ratio) * 100).toFixed(0)}%`,
          href: cur.product_id ? `/admin/productos?focus=${cur.product_id}` : undefined,
        });
      }
    }

    // 2. Capital inmovilizado: stock alto + sin venta 30d + cost_price
    const soldLast30 = await db.order_items.findMany({
      where: {
        orders: { status: { in: ['paid', 'completed'] }, created_at: { gte: start30d } },
        product_id: { not: null },
      },
      select: { product_id: true },
      distinct: ['product_id'],
    });
    const soldIds = new Set(soldLast30.map((s) => s.product_id));

    const allStocked = await db.products.findMany({
      where: { active: true, stock: { gte: 5 }, cost_price: { not: null } },
      select: { id: true, name: true, stock: true, cost_price: true, price: true },
      take: 800,
    });
    const frozen = allStocked
      .filter((p) => !soldIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        capital: Number(p.cost_price ?? 0) * p.stock,
      }))
      .filter((p) => p.capital >= 20000)
      .sort((a, b) => b.capital - a.capital)
      .slice(0, 5);

    if (frozen.length > 0) {
      const totalFrozen = frozen.reduce((s, p) => s + p.capital, 0);
      insights.push({
        type: 'frozen_capital',
        severity: 'warning',
        title: 'Capital inmovilizado',
        detail: `${frozen.length} productos sin venta en 30 días suman ~$${totalFrozen.toLocaleString('es-CL')} en stock. Top: ${frozen[0].name}.`,
        value: totalFrozen,
        href: '/admin/farmacia/liquidacion',
        meta: { products: frozen },
      });
    }

    // 3. Lotes próximos a vencer sin descuento aplicado
    const expiringBatches = await db.product_batches.findMany({
      where: {
        expiry_date: { gte: now, lte: in60d },
        quantity: { gt: 0 },
      },
      select: {
        product_id: true,
        quantity: true,
        expiry_date: true,
        products: { select: { name: true, discount_percent: true } },
      },
      take: 200,
    });
    const noDiscount = expiringBatches.filter(
      (b) => (b.products?.discount_percent ?? 0) === 0
    );
    if (noDiscount.length > 0) {
      const uniqueProducts = new Set(noDiscount.map((b) => b.product_id)).size;
      insights.push({
        type: 'expiry_no_discount',
        severity: 'critical',
        title: 'Lotes vencen sin descuento',
        detail: `${uniqueProducts} producto${uniqueProducts !== 1 ? 's' : ''} con stock que vence en 60d y sin liquidación aplicada.`,
        value: uniqueProducts,
        href: '/admin/farmacia/liquidacion',
      });
    }

    // 4. Clientes en riesgo: registrados con >=3 compras y última compra > frequency*1.5
    const ordersByUser = await db.orders.findMany({
      where: { status: { in: ['paid', 'completed'] }, user_id: { not: null } },
      select: { user_id: true, created_at: true, total: true },
      orderBy: { created_at: 'asc' },
    });
    const userMap = new Map<string, { dates: number[]; lifetime: number }>();
    for (const o of ordersByUser) {
      if (!o.user_id) continue;
      const entry = userMap.get(o.user_id) ?? { dates: [], lifetime: 0 };
      entry.dates.push(o.created_at.getTime());
      entry.lifetime += Number(o.total);
      userMap.set(o.user_id, entry);
    }
    const userIds = Array.from(userMap.keys());
    const profilesData = userIds.length > 0
      ? await db.profiles.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, phone: true },
        })
      : [];
    const profileMap = new Map(profilesData.map((p) => [p.id, p]));

    const atRisk: Array<{ id: string; name: string; daysSince: number; freq: number; lifetime: number }> = [];
    for (const uid of Array.from(userMap.keys())) {
      const data = userMap.get(uid)!;
      if (data.dates.length < 3) continue;
      const first = data.dates[0];
      const last = data.dates[data.dates.length - 1];
      const span = last - first;
      const freq = span / (data.dates.length - 1) / (1000 * 60 * 60 * 24);
      const daysSince = (now.getTime() - last) / (1000 * 60 * 60 * 24);
      if (daysSince > freq * 1.5 && daysSince > 30) {
        const prof = profileMap.get(uid);
        atRisk.push({
          id: uid,
          name: prof?.name || prof?.phone || 'Cliente',
          daysSince: Math.round(daysSince),
          freq: Math.round(freq),
          lifetime: data.lifetime,
        });
      }
    }
    atRisk.sort((a, b) => b.lifetime - a.lifetime);
    if (atRisk.length > 0) {
      const top = atRisk.slice(0, 3);
      insights.push({
        type: 'customer_at_risk',
        severity: 'warning',
        title: `${atRisk.length} cliente${atRisk.length !== 1 ? 's' : ''} en riesgo`,
        detail: `Compradores recurrentes que no vuelven. Top: ${top.map((c) => c.name).join(', ')}.`,
        value: atRisk.length,
        href: '/admin/clientes',
        meta: { customers: top },
      });
    }

    // 5. No sales today comparado a 8 semanas
    const todayOrders = await db.orders.count({
      where: { status: { in: ['paid', 'completed'] }, created_at: { gte: startToday } },
    });
    const past8wOrders = await db.orders.count({
      where: { status: { in: ['paid', 'completed'] }, created_at: { gte: start8w } },
    });
    const expectedDaily = past8wOrders / 56;
    const hour = now.getHours();
    if (hour >= 14 && todayOrders < expectedDaily * 0.4 && expectedDaily >= 5) {
      insights.push({
        type: 'no_sales',
        severity: 'critical',
        title: 'Ventas hoy bajo lo esperado',
        detail: `${todayOrders} órdenes hoy vs ~${expectedDaily.toFixed(0)} promedio. Revisa POS y checa equipo.`,
        value: todayOrders,
        href: '/admin/operaciones',
      });
    }

    // Sort: critical → warning → positive → info
    const sevOrder: Record<Insight['severity'], number> = { critical: 0, warning: 1, positive: 2, info: 3 };
    insights.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

    return NextResponse.json({
      generated_at: now.toISOString(),
      count: insights.length,
      insights,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
