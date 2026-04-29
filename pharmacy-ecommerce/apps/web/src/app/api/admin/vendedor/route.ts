import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

const SETTING_TURNO_INICIO = 'caja_turno_inicio';
const SETTING_FONDO_INICIAL = 'caja_fondo_inicial';

export async function GET() {
  try {
    const user = await getAdminUser();
    if (!user) return errorResponse('Unauthorized', 403);

    const db = await getDb();
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const [
      settings,
      goalSettings,
      myPosOrdersToday,
      myPosOrdersAll,
      pickupsToday,
      myTasks,
      announcements,
    ] = await Promise.all([
      db.admin_settings.findMany({
        where: { key: { in: [SETTING_TURNO_INICIO, SETTING_FONDO_INICIAL] } },
      }),
      db.admin_settings.findMany({
        where: { key: { in: ['daily_revenue_goal', 'monthly_revenue_goal'] } },
      }),
      db.orders.findMany({
        where: {
          sold_by_user_id: user.uid,
          created_at: { gte: todayStart },
          status: 'completed',
          payment_provider: { in: ['pos_cash', 'pos_debit', 'pos_credit', 'pos_mixed'] },
        },
        select: { total: true, created_at: true, payment_provider: true },
        orderBy: { created_at: 'desc' },
      }),
      db.orders.findMany({
        where: {
          created_at: { gte: todayStart },
          status: 'completed',
          payment_provider: { in: ['pos_cash', 'pos_debit', 'pos_credit', 'pos_mixed'] },
        },
        select: { total: true },
      }),
      db.orders.findMany({
        where: {
          status: 'reserved',
          reservation_expires_at: { gte: todayStart, lt: tomorrowStart },
        },
        select: {
          id: true,
          pickup_code: true,
          total: true,
          guest_name: true,
          guest_surname: true,
          customer_phone: true,
          reservation_expires_at: true,
          created_at: true,
        },
        orderBy: { reservation_expires_at: 'asc' },
        take: 30,
      }),
      db.internal_tasks.findMany({
        where: {
          status: 'open',
          OR: [
            { assigned_to_uid: user.uid },
            ...(user.role ? [{ assigned_role: user.role }] : []),
          ],
        },
        orderBy: [{ priority: 'desc' }, { due_date: 'asc' }],
        take: 10,
      }),
      db.announcements.findMany({
        where: {
          OR: [{ expires_at: null }, { expires_at: { gt: now } }],
          visible_to: { in: ['all', user.role || 'seller'] },
        },
        orderBy: [{ pinned: 'desc' }, { created_at: 'desc' }],
        take: 5,
      }),
    ]);

    const settingsMap: Record<string, string> = {};
    for (const s of settings) settingsMap[s.key] = s.value;
    for (const s of goalSettings) settingsMap[s.key] = s.value;

    const turnoInicio = settingsMap[SETTING_TURNO_INICIO]
      ? new Date(settingsMap[SETTING_TURNO_INICIO])
      : todayStart;
    const fondoInicial = parseFloat(settingsMap[SETTING_FONDO_INICIAL] ?? '0');
    const dailyGoal = parseFloat(settingsMap['daily_revenue_goal'] ?? '0');

    const myRevenue = myPosOrdersToday.reduce((s, o) => s + Number(o.total), 0);
    const myCount = myPosOrdersToday.length;
    const myAvgTicket = myCount > 0 ? myRevenue / myCount : 0;

    const totalRevenueToday = myPosOrdersAll.reduce((s, o) => s + Number(o.total), 0);

    return NextResponse.json({
      turno: {
        inicio: turnoInicio.toISOString(),
        fondo_inicial: fondoInicial,
        configurado: fondoInicial > 0,
      },
      mis_ventas: {
        revenue: myRevenue,
        count: myCount,
        avg_ticket: myAvgTicket,
      },
      meta: {
        daily_goal: dailyGoal,
        revenue_today: totalRevenueToday,
        progress_pct: dailyGoal > 0 ? Math.min(100, (totalRevenueToday / dailyGoal) * 100) : 0,
      },
      bandeja_retiros: pickupsToday.map((o) => ({
        id: o.id,
        pickup_code: o.pickup_code,
        total: Number(o.total),
        customer: `${o.guest_name ?? ''} ${o.guest_surname ?? ''}`.trim() || 'Cliente',
        phone: o.customer_phone,
        expires_at: o.reservation_expires_at?.toISOString() ?? null,
        created_at: o.created_at.toISOString(),
      })),
      mis_tareas: myTasks,
      avisos: announcements,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
