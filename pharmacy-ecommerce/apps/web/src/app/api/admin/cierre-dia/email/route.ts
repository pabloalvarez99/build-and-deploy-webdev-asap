import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';
import { sendDailySummary } from '@/lib/email';

const POS_PROVIDERS = ['pos_cash', 'pos_debit', 'pos_credit', 'pos_mixed'];

export async function POST(request: NextRequest) {
  try {
    const owner = await getOwnerUser();
    if (!owner) return errorResponse('Unauthorized', 403);

    const body = await request.json().catch(() => ({}));
    const overrideEmail: string | undefined = body?.to;
    const dateParam: string | undefined = body?.date;

    const db = await getDb();
    const d = dateParam ? new Date(dateParam + 'T00:00:00') : new Date();
    const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
    const prevStart = new Date(dayStart); prevStart.setDate(prevStart.getDate() - 1);
    const now = new Date();

    let to = overrideEmail;
    if (!to) {
      const setting = await db.admin_settings.findUnique({ where: { key: 'alert_email' } });
      to = setting?.value;
    }
    if (!to) {
      return NextResponse.json({ error: 'Sin email configurado. Define alert_email en configuración.' }, { status: 400 });
    }

    const [
      ventasHoy, ventasAyer, costoHoyRows, targetSettings, orderItems,
      reservasUrgentes, porVencer7d, stockCero, faltasConStock, lastClose,
    ] = await Promise.all([
      db.orders.aggregate({
        where: { created_at: { gte: dayStart, lt: dayEnd }, status: { in: ['paid', 'completed', 'reserved'] } },
        _sum: { total: true }, _count: { id: true },
      }),
      db.orders.aggregate({
        where: { created_at: { gte: prevStart, lt: dayStart }, status: { in: ['paid', 'completed', 'reserved'] } },
        _sum: { total: true },
      }),
      db.$queryRaw<{ costo_hoy: string }[]>`
        SELECT COALESCE(SUM(oi.quantity * p.cost_price), 0)::text AS costo_hoy
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= ${dayStart} AND o.created_at < ${dayEnd}
          AND o.status IN ('paid', 'completed') AND p.cost_price > 0
      `,
      db.admin_settings.findMany({
        where: { key: { in: ['daily_sales_target'] } }, select: { key: true, value: true },
      }),
      db.order_items.findMany({
        where: { orders: { created_at: { gte: dayStart, lt: dayEnd }, status: { in: ['paid', 'completed'] } } },
        select: { product_name: true, quantity: true, price_at_purchase: true },
      }),
      db.orders.count({
        where: { status: 'reserved', reservation_expires_at: { lte: new Date(now.getTime() + 12 * 3600000) } },
      }),
      db.product_batches.count({
        where: { expiry_date: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) }, quantity: { gt: 0 } },
      }),
      db.products.count({ where: { active: true, stock: 0 } }),
      db.faltas.count({ where: { status: 'pending', products: { stock: { gt: 0 } } } }),
      db.caja_cierres.findFirst({
        where: { created_at: { gte: dayStart, lt: dayEnd } },
        orderBy: { created_at: 'desc' }, select: { diferencia: true },
      }),
    ]);

    const ventasHoyNum = Number(ventasHoy._sum.total ?? 0);
    const ventasAyerNum = Number(ventasAyer._sum.total ?? 0);
    const costoHoy = Number(costoHoyRows[0]?.costo_hoy ?? 0);
    const targetsMap = Object.fromEntries(targetSettings.map((s) => [s.key, s.value]));
    const metaDiaria = targetsMap['daily_sales_target'] ? Number(targetsMap['daily_sales_target']) : null;

    const productMap: Record<string, { name: string; units: number; revenue: number }> = {};
    for (const i of orderItems) {
      const k = i.product_name;
      if (!productMap[k]) productMap[k] = { name: k, units: 0, revenue: 0 };
      productMap[k].units += i.quantity;
      productMap[k].revenue += i.quantity * Number(i.price_at_purchase);
    }
    const top5 = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const dateLabel = dayStart.toLocaleDateString('es-CL', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Santiago',
    });

    await sendDailySummary({
      to,
      date: dateLabel,
      ventas_hoy: ventasHoyNum,
      ordenes_hoy: ventasHoy._count.id,
      delta_ventas_pct: ventasAyerNum > 0
        ? Math.round(((ventasHoyNum - ventasAyerNum) / ventasAyerNum) * 100)
        : null,
      margen_bruto: costoHoy > 0 ? ventasHoyNum - costoHoy : null,
      meta_diaria: metaDiaria,
      pct_meta: metaDiaria && metaDiaria > 0 ? Math.round((ventasHoyNum / metaDiaria) * 100) : null,
      diferencia_caja: lastClose ? Number(lastClose.diferencia) : null,
      top_productos: top5,
      alertas: {
        reservas_por_expirar: reservasUrgentes,
        por_vencer_7d: porVencer7d,
        stock_cero: stockCero,
        faltas_con_stock: faltasConStock,
      },
    });

    return NextResponse.json({ sent: true, to });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
