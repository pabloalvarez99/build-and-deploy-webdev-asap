import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET() {
  try {
    const owner = await getOwnerUser();
    if (!owner) return errorResponse('Unauthorized', 403);

    const db = await getDb();
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    const yoyStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
    const yoyEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0, 23, 59, 59, 999);
    const in7d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      ingMes, ingPrev, ingYoY,
      gastoMes, gastoPrev,
      apOpen, apOverdue, apDue7d,
      pendingFaltas, criticalStock,
      topMargin, salesByProduct,
      goalSettings,
      tasksDone7d, tasksOpen,
      ordersToday, ordersYesterday,
    ] = await Promise.all([
      db.orders.aggregate({
        where: { status: { in: ['paid', 'completed'] }, created_at: { gte: startMonth, lte: endMonth } },
        _sum: { total: true }, _count: true,
      }),
      db.orders.aggregate({
        where: { status: { in: ['paid', 'completed'] }, created_at: { gte: prevStart, lte: prevEnd } },
        _sum: { total: true },
      }),
      db.orders.aggregate({
        where: { status: { in: ['paid', 'completed'] }, created_at: { gte: yoyStart, lte: yoyEnd } },
        _sum: { total: true },
      }),
      db.gastos.aggregate({
        where: { expense_date: { gte: startMonth, lte: endMonth } },
        _sum: { amount: true },
      }),
      db.gastos.aggregate({
        where: { expense_date: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
      db.purchase_orders.aggregate({
        where: { status: 'received', paid: false },
        _sum: { total_cost: true }, _count: true,
      }),
      db.purchase_orders.aggregate({
        where: { status: 'received', paid: false, due_date: { lt: now } },
        _sum: { total_cost: true }, _count: true,
      }),
      db.purchase_orders.aggregate({
        where: { status: 'received', paid: false, due_date: { gte: now, lt: in7d } },
        _sum: { total_cost: true }, _count: true,
      }),
      db.faltas.count({ where: { status: 'pending' } }),
      db.products.count({ where: { active: true, stock: { lte: 10 } } }),
      // Top 5 margin (price - cost) products active
      db.products.findMany({
        where: { active: true, cost_price: { not: null } },
        select: { id: true, name: true, price: true, cost_price: true, stock: true },
        take: 200,
      }),
      // Sales aggregate by product this month
      db.order_items.groupBy({
        by: ['product_id', 'product_name'],
        where: {
          orders: { status: { in: ['paid', 'completed'] }, created_at: { gte: startMonth, lte: endMonth } },
        },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      db.admin_settings.findMany({
        where: { key: { in: ['monthly_sales_target', 'daily_sales_target'] } },
      }),
      db.internal_tasks.count({
        where: { status: 'done', completed_at: { gte: sevenDaysAgo } },
      }),
      db.internal_tasks.count({
        where: { status: 'open' },
      }),
      db.orders.count({
        where: {
          status: { in: ['paid', 'completed'] },
          created_at: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
        },
      }),
      db.orders.count({
        where: {
          status: { in: ['paid', 'completed'] },
          created_at: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
          },
        },
      }),
    ]);

    const settingsMap: Record<string, string> = {};
    for (const s of goalSettings) settingsMap[s.key] = s.value;
    const monthlyTarget = parseFloat(settingsMap['monthly_sales_target'] ?? '0');

    const dayOfMonth = now.getDate();
    const daysInMonth = endMonth.getDate();
    const dailyAvg = dayOfMonth > 0 ? Number(ingMes._sum.total || 0) / dayOfMonth : 0;
    const forecastClose = dailyAvg * daysInMonth;
    const targetProgressPct = monthlyTarget > 0 ? (Number(ingMes._sum.total || 0) / monthlyTarget) * 100 : 0;
    const forecastVsTargetPct = monthlyTarget > 0 ? (forecastClose / monthlyTarget) * 100 : 0;

    const ingresos = Number(ingMes._sum.total || 0);
    const ingresosPrev = Number(ingPrev._sum.total || 0);
    const ingresosYoY = Number(ingYoY._sum.total || 0);
    const gastos = Number(gastoMes._sum.amount || 0);
    const gastosPrev = Number(gastoPrev._sum.amount || 0);

    // Estimate COGS from order items × cost_price
    const orderItems = await db.order_items.findMany({
      where: {
        orders: { status: { in: ['paid', 'completed'] }, created_at: { gte: startMonth, lte: endMonth } },
      },
      select: { quantity: true, products: { select: { cost_price: true } } },
    });
    const cogs = orderItems.reduce((sum, it) => {
      const c = it.products?.cost_price ? Number(it.products.cost_price) : 0;
      return sum + c * it.quantity;
    }, 0);

    const grossMargin = ingresos - cogs;
    const ebitda = grossMargin - gastos;
    const grossMarginPct = ingresos > 0 ? (grossMargin / ingresos) * 100 : 0;

    const momPct = ingresosPrev > 0 ? ((ingresos - ingresosPrev) / ingresosPrev) * 100 : 0;
    const yoyPct = ingresosYoY > 0 ? ((ingresos - ingresosYoY) / ingresosYoY) * 100 : 0;

    const topByMargin = topMargin
      .map((p) => ({
        id: p.id,
        name: p.name,
        margin: Number(p.price) - Number(p.cost_price),
        marginPct: ((Number(p.price) - Number(p.cost_price)) / Number(p.price)) * 100,
      }))
      .filter((p) => p.margin > 0)
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 5);

    // Health Score 0-100 (composite ponderado)
    const metaScore = monthlyTarget > 0 ? Math.min(100, forecastVsTargetPct) : 70;
    const marginTarget = 30;
    const marginScore = Math.min(100, Math.max(0, (grossMarginPct / marginTarget) * 100));
    const totalAlerts = apOverdue._count + pendingFaltas + criticalStock;
    const alertsScore = Math.max(0, 100 - Math.min(100, totalAlerts * 8));
    const rotationScore = ingresosPrev > 0
      ? Math.min(100, Math.max(20, ((ingresos / Math.max(1, dayOfMonth)) / (ingresosPrev / daysInMonth)) * 80))
      : 60;
    const totalTasks = tasksDone7d + tasksOpen;
    const tasksScore = totalTasks > 0 ? Math.min(100, (tasksDone7d / totalTasks) * 100) : 80;

    const healthScore = Math.round(
      metaScore * 0.30 +
      marginScore * 0.25 +
      alertsScore * 0.20 +
      rotationScore * 0.15 +
      tasksScore * 0.10
    );

    const breakdown = [
      { key: 'meta', label: 'Meta del mes', weight: 30, score: Math.round(metaScore), hint: monthlyTarget > 0 ? `${forecastVsTargetPct.toFixed(0)}% proyección vs meta` : 'Sin meta configurada' },
      { key: 'margen', label: 'Margen bruto', weight: 25, score: Math.round(marginScore), hint: `${grossMarginPct.toFixed(1)}% (objetivo ${marginTarget}%)` },
      { key: 'alertas', label: 'Alertas críticas', weight: 20, score: Math.round(alertsScore), hint: `${totalAlerts} alertas activas` },
      { key: 'rotacion', label: 'Rotación', weight: 15, score: Math.round(rotationScore), hint: `${ingresosPrev > 0 ? (momPct >= 0 ? '+' : '') + momPct.toFixed(0) + '% MoM' : 'Sin datos previos'}` },
      { key: 'tareas', label: 'Cumplimiento equipo', weight: 10, score: Math.round(tasksScore), hint: `${tasksDone7d} hechas / ${tasksOpen} abiertas` },
    ];

    const lowest = [...breakdown].sort((a, b) => a.score - b.score)[0];
    let suggestion = '';
    if (lowest.key === 'alertas' && totalAlerts > 0) {
      if (apOverdue._count > 0) suggestion = `Paga ${apOverdue._count} factura${apOverdue._count !== 1 ? 's' : ''} vencida${apOverdue._count !== 1 ? 's' : ''}.`;
      else if (pendingFaltas > 0) suggestion = `Resuelve ${pendingFaltas} falta${pendingFaltas !== 1 ? 's' : ''} pendiente${pendingFaltas !== 1 ? 's' : ''}.`;
      else if (criticalStock > 0) suggestion = `Repón ${criticalStock} producto${criticalStock !== 1 ? 's' : ''} con stock crítico.`;
    } else if (lowest.key === 'meta' && monthlyTarget > 0) {
      suggestion = `Empuja ventas: faltan ${(100 - targetProgressPct).toFixed(0)}% de la meta.`;
    } else if (lowest.key === 'meta') {
      suggestion = 'Configura una meta mensual en Configuración.';
    } else if (lowest.key === 'margen') {
      suggestion = `Sube precios o negocia costos: margen bajo (${grossMarginPct.toFixed(0)}%).`;
    } else if (lowest.key === 'rotacion') {
      suggestion = 'Activa promociones o liquidación de stock antiguo.';
    } else if (lowest.key === 'tareas') {
      suggestion = `Hay ${tasksOpen} tareas internas sin cerrar.`;
    } else {
      suggestion = '¡Negocio en buen estado! Mantén el ritmo.';
    }

    let healthLabel = 'Saludable';
    if (healthScore < 50) healthLabel = 'Crítico';
    else if (healthScore < 65) healthLabel = 'En riesgo';
    else if (healthScore < 80) healthLabel = 'Estable';
    else if (healthScore >= 90) healthLabel = 'Excelente';

    void ordersToday; void ordersYesterday;

    return NextResponse.json({
      health: {
        score: healthScore,
        label: healthLabel,
        breakdown,
        suggestion,
      },
      kpis: {
        ingresos, ingresos_prev: ingresosPrev, ingresos_yoy: ingresosYoY,
        cogs, gross_margin: grossMargin, gross_margin_pct: grossMarginPct,
        gastos, gastos_prev: gastosPrev,
        ebitda,
        mom_pct: momPct, yoy_pct: yoyPct,
        order_count: ingMes._count,
      },
      ap: {
        open_count: apOpen._count,
        open_amount: Number(apOpen._sum.total_cost || 0),
        overdue_count: apOverdue._count,
        overdue_amount: Number(apOverdue._sum.total_cost || 0),
        due_7d_count: apDue7d._count,
        due_7d_amount: Number(apDue7d._sum.total_cost || 0),
      },
      ops: {
        pending_faltas: pendingFaltas,
        critical_stock: criticalStock,
      },
      top_margin: topByMargin,
      top_rotation: salesByProduct.map((s) => ({
        product_id: s.product_id,
        product_name: s.product_name,
        units: s._sum.quantity ?? 0,
      })),
      forecast: {
        monthly_target: monthlyTarget,
        revenue_so_far: Number(ingMes._sum.total || 0),
        daily_avg: dailyAvg,
        forecast_close: forecastClose,
        target_progress_pct: targetProgressPct,
        forecast_vs_target_pct: forecastVsTargetPct,
        days_elapsed: dayOfMonth,
        days_in_month: daysInMonth,
      },
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
