import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const sp = request.nextUrl.searchParams;
  const year = parseInt(sp.get('year') || String(new Date().getFullYear()));

  const db = await getDb();

  const months = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(year, i, 1);
    const end = new Date(year, i + 1, 0, 23, 59, 59, 999);
    const prevStart = new Date(year - 1, i, 1);
    const prevEnd = new Date(year - 1, i + 1, 0, 23, 59, 59, 999);
    return { month: i + 1, start, end, prevStart, prevEnd };
  });

  const monthlyData = await Promise.all(
    months.map(async ({ month, start, end, prevStart, prevEnd }) => {
      const [ingCur, ingPrev, gastoCur, gastoPrev] = await Promise.all([
        db.orders.aggregate({
          where: { status: { in: ['paid', 'completed'] }, created_at: { gte: start, lte: end } },
          _sum: { total: true },
        }),
        db.orders.aggregate({
          where: { status: { in: ['paid', 'completed'] }, created_at: { gte: prevStart, lte: prevEnd } },
          _sum: { total: true },
        }),
        db.gastos.aggregate({
          where: { expense_date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        db.gastos.aggregate({
          where: { expense_date: { gte: prevStart, lte: prevEnd } },
          _sum: { amount: true },
        }),
      ]);

      const ingresos = Number(ingCur._sum.total || 0);
      const gastos = Number(gastoCur._sum.amount || 0);
      const ingresosPrev = Number(ingPrev._sum.total || 0);
      const gastosPrev = Number(gastoPrev._sum.amount || 0);

      return {
        month,
        ingresos,
        gastos,
        margen: ingresos - gastos,
        ingresos_prev: ingresosPrev,
        gastos_prev: gastosPrev,
        margen_prev: ingresosPrev - gastosPrev,
      };
    })
  );

  const now = new Date();
  const ytdMonths = year === now.getFullYear() ? monthlyData.slice(0, now.getMonth() + 1) : monthlyData;
  const ytd = {
    ingresos: ytdMonths.reduce((s, m) => s + m.ingresos, 0),
    gastos: ytdMonths.reduce((s, m) => s + m.gastos, 0),
    margen: ytdMonths.reduce((s, m) => s + m.margen, 0),
  };

  return NextResponse.json({ year, months: monthlyData, ytd });
}
