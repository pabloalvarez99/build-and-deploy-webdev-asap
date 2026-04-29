import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

const POS_PROVIDERS = ['pos_cash', 'pos_debit', 'pos_credit', 'pos_mixed'];

function dayBounds(dateStr: string | null): { dayStart: Date; dayEnd: Date; prevStart: Date; prevEnd: Date } {
  const d = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const dayStart = new Date(d);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  const prevStart = new Date(dayStart);
  prevStart.setDate(prevStart.getDate() - 1);
  const prevEnd = new Date(dayStart);
  return { dayStart, dayEnd, prevStart, prevEnd };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return errorResponse('Unauthorized', 403);

    const url = new URL(request.url);
    const dateParam = url.searchParams.get('date');
    const { dayStart, dayEnd, prevStart, prevEnd } = dayBounds(dateParam);

    const db = await getDb();
    const now = new Date();
    const tomorrowStart = new Date(); tomorrowStart.setHours(0, 0, 0, 0); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(tomorrowStart); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    const in7d = new Date(now.getTime() + 7 * 86400000);

    const [
      ordersAll,
      ordersPrev,
      ordersOnline,
      ordersPos,
      orderItems,
      reservas_manana,
      recetas,
      recetas_controladas,
      tasksDoneToday,
      tasksOpenAll,
      tasksOpenOverdue,
      announcementsActive,
      caja_cierre,
      pharmacist_shift,
      stockCero,
      lotes_7d,
      faltasConStock,
      gastosToday,
    ] = await Promise.all([
      db.orders.findMany({
        where: { created_at: { gte: dayStart, lt: dayEnd }, status: { in: ['paid', 'completed', 'reserved'] } },
        select: {
          id: true, total: true, status: true, payment_provider: true, created_at: true,
          cash_amount: true, card_amount: true, sold_by_user_id: true, sold_by_name: true,
        },
      }),
      db.orders.aggregate({
        where: { created_at: { gte: prevStart, lt: prevEnd }, status: { in: ['paid', 'completed', 'reserved'] } },
        _sum: { total: true }, _count: { id: true },
      }),
      db.orders.aggregate({
        where: {
          created_at: { gte: dayStart, lt: dayEnd },
          status: { in: ['paid', 'completed'] },
          OR: [{ payment_provider: { notIn: POS_PROVIDERS } }, { payment_provider: null }],
        },
        _sum: { total: true }, _count: { id: true },
      }),
      db.orders.aggregate({
        where: {
          created_at: { gte: dayStart, lt: dayEnd },
          status: 'completed',
          payment_provider: { in: POS_PROVIDERS },
        },
        _sum: { total: true }, _count: { id: true },
      }),
      db.order_items.findMany({
        where: {
          orders: { created_at: { gte: dayStart, lt: dayEnd }, status: { in: ['paid', 'completed'] } },
        },
        select: {
          product_name: true, quantity: true, price_at_purchase: true,
          products: { select: { cost_price: true } },
        },
      }),
      db.orders.findMany({
        where: {
          status: 'reserved',
          reservation_expires_at: { gte: tomorrowStart, lt: tomorrowEnd },
        },
        select: { id: true, pickup_code: true, total: true, guest_name: true, guest_surname: true, customer_phone: true, reservation_expires_at: true },
        orderBy: { reservation_expires_at: 'asc' },
        take: 30,
      }),
      db.prescription_records.count({
        where: { dispensed_at: { gte: dayStart, lt: dayEnd } },
      }),
      db.prescription_records.count({
        where: { dispensed_at: { gte: dayStart, lt: dayEnd }, is_controlled: true },
      }),
      db.internal_tasks.count({
        where: { status: 'done', completed_at: { gte: dayStart, lt: dayEnd } },
      }),
      db.internal_tasks.count({
        where: { status: 'open' },
      }),
      db.internal_tasks.count({
        where: { status: 'open', due_date: { lt: dayStart } },
      }),
      db.announcements.count({
        where: {
          severity: { in: ['warning', 'critical'] },
          OR: [{ expires_at: null }, { expires_at: { gt: now } }],
        },
      }),
      db.caja_cierres.findFirst({
        where: { created_at: { gte: dayStart, lt: dayEnd } },
        orderBy: { created_at: 'desc' },
      }),
      db.pharmacist_shifts.findFirst({
        where: { shift_start: { gte: dayStart, lt: dayEnd } },
        orderBy: { shift_start: 'desc' },
      }),
      db.products.count({ where: { active: true, stock: 0 } }),
      db.product_batches.count({ where: { quantity: { gt: 0 }, expiry_date: { gte: now, lte: in7d } } }),
      db.faltas.count({ where: { status: 'pending', products: { stock: { gt: 0 } } } }),
      db.gastos.aggregate({
        where: { expense_date: { gte: dayStart, lt: dayEnd } },
        _sum: { amount: true }, _count: true,
      }),
    ]);

    // Aggregate ventas
    let ventas_efectivo = 0, ventas_debito = 0, ventas_credito = 0;
    let count_efectivo = 0, count_debito = 0, count_credito = 0;
    let count_mixto = 0;
    for (const o of ordersAll) {
      if (o.status !== 'completed' && o.status !== 'paid') continue;
      const total = Number(o.total);
      const prov = o.payment_provider;
      if (prov === 'pos_cash') { ventas_efectivo += total; count_efectivo += 1; }
      else if (prov === 'pos_debit') { ventas_debito += total; count_debito += 1; }
      else if (prov === 'pos_credit') { ventas_credito += total; count_credito += 1; }
      else if (prov === 'pos_mixed') {
        ventas_efectivo += Number(o.cash_amount ?? 0);
        ventas_debito += Number(o.card_amount ?? 0);
        count_mixto += 1;
      }
    }

    const total_pos = ventas_efectivo + ventas_debito + ventas_credito;
    const count_pos = count_efectivo + count_debito + count_credito + count_mixto;
    const onlineRev = Number(ordersOnline._sum.total ?? 0);
    const totalRevenue = total_pos + onlineRev;
    const totalCount = count_pos + (ordersOnline._count.id ?? 0);

    // Top productos
    const topMap: Record<string, { name: string; units: number; revenue: number; cogs: number }> = {};
    let cogs_total = 0;
    let revenue_completed = 0;
    for (const it of orderItems) {
      const k = it.product_name;
      const rev = Number(it.price_at_purchase) * it.quantity;
      const cost = it.products?.cost_price ? Number(it.products.cost_price) * it.quantity : 0;
      revenue_completed += rev;
      cogs_total += cost;
      if (!topMap[k]) topMap[k] = { name: k, units: 0, revenue: 0, cogs: 0 };
      topMap[k].units += it.quantity;
      topMap[k].revenue += rev;
      topMap[k].cogs += cost;
    }
    const top_productos = Object.values(topMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Ventas por vendedor (hoy)
    const sellerMap: Record<string, { uid: string; name: string; revenue: number; count: number }> = {};
    for (const o of ordersAll) {
      if (o.status !== 'completed') continue;
      const uid = o.sold_by_user_id;
      if (!uid) continue;
      const total = Number(o.total);
      if (!sellerMap[uid]) sellerMap[uid] = { uid, name: o.sold_by_name || 'Sin nombre', revenue: 0, count: 0 };
      sellerMap[uid].revenue += total;
      sellerMap[uid].count += 1;
    }
    const por_vendedor = Object.values(sellerMap).sort((a, b) => b.revenue - a.revenue);

    const prevTotal = Number(ordersPrev._sum.total ?? 0);
    const delta_pct = prevTotal > 0 ? ((totalRevenue - prevTotal) / prevTotal) * 100 : null;

    const margen_bruto = cogs_total > 0 ? revenue_completed - cogs_total : null;
    const margen_pct = margen_bruto !== null && revenue_completed > 0 ? (margen_bruto / revenue_completed) * 100 : null;

    const dateLabel = dayStart.toLocaleDateString('es-CL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      timeZone: 'America/Santiago',
    });

    return NextResponse.json({
      date: dayStart.toISOString().slice(0, 10),
      date_label: dateLabel,
      ventas: {
        total: totalRevenue,
        count: totalCount,
        delta_pct,
        prev_total: prevTotal,
        avg_ticket: totalCount > 0 ? totalRevenue / totalCount : 0,
        pos: { revenue: total_pos, count: count_pos, efectivo: ventas_efectivo, debito: ventas_debito, credito: ventas_credito, mixto_count: count_mixto },
        online: { revenue: onlineRev, count: ordersOnline._count.id ?? 0 },
      },
      finanzas: {
        cogs: cogs_total,
        margen_bruto,
        margen_pct,
        gastos: Number(gastosToday._sum.amount ?? 0),
        gastos_count: gastosToday._count,
      },
      caja: caja_cierre ? {
        id: caja_cierre.id,
        turno_inicio: caja_cierre.turno_inicio.toISOString(),
        turno_fin: caja_cierre.turno_fin.toISOString(),
        fondo_inicial: Number(caja_cierre.fondo_inicial),
        ventas_total: Number(caja_cierre.ventas_total),
        efectivo_esperado: Number(caja_cierre.efectivo_esperado),
        efectivo_contado: Number(caja_cierre.efectivo_contado),
        diferencia: Number(caja_cierre.diferencia),
        cerrado_por: caja_cierre.cerrado_por,
        notas: caja_cierre.notas,
      } : null,
      farmacia: {
        recetas_total: recetas,
        recetas_controladas,
        turno: pharmacist_shift ? {
          pharmacist_name: pharmacist_shift.pharmacist_name,
          shift_start: pharmacist_shift.shift_start.toISOString(),
          shift_end: pharmacist_shift.shift_end?.toISOString() ?? null,
        } : null,
      },
      tareas: {
        completadas_hoy: tasksDoneToday,
        abiertas: tasksOpenAll,
        atrasadas: tasksOpenOverdue,
      },
      avisos_activos: announcementsActive,
      por_vendedor,
      top_productos,
      manana: {
        retiros: reservas_manana.map((o) => ({
          id: o.id,
          pickup_code: o.pickup_code,
          total: Number(o.total),
          customer: `${o.guest_name ?? ''} ${o.guest_surname ?? ''}`.trim() || 'Cliente',
          phone: o.customer_phone,
          expires_at: o.reservation_expires_at?.toISOString() ?? null,
        })),
        alertas: {
          stock_cero: stockCero,
          lotes_7d,
          faltas_con_stock: faltasConStock,
        },
      },
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
