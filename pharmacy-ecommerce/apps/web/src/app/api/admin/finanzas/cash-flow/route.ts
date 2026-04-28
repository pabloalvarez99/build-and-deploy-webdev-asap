import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

function dateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

type DayEntry = { date: string; inflow: number; outflow: number; projected_outflow: number };

export async function GET() {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const db = await getDb();
  const now = new Date();
  const past30 = new Date(now);
  past30.setDate(past30.getDate() - 30);
  const future30 = new Date(now);
  future30.setDate(future30.getDate() + 30);

  const [ingresosReal, pagosReal, gastosReal, ocProjected, recurring] = await Promise.all([
    db.orders.findMany({
      where: { status: { in: ['paid', 'completed'] }, created_at: { gte: past30, lte: now } },
      select: { created_at: true, total: true },
    }),
    db.purchase_payments.findMany({
      where: { paid_at: { gte: past30, lte: now } },
      select: { paid_at: true, amount: true },
    }),
    db.gastos.findMany({
      where: { paid_at: { gte: past30, lte: now } },
      select: { paid_at: true, amount: true },
    }),
    db.purchase_orders.findMany({
      where: { status: 'received', paid: false, due_date: { gte: now, lte: future30 } },
      select: { due_date: true, total_cost: true },
    }),
    db.recurring_expenses.findMany({
      where: { active: true },
      select: { day_of_month: true, amount: true },
    }),
  ]);

  const map = new Map<string, DayEntry>();
  const getDay = (date: string): DayEntry => {
    if (!map.has(date)) map.set(date, { date, inflow: 0, outflow: 0, projected_outflow: 0 });
    return map.get(date)!;
  };

  ingresosReal.forEach(o => { getDay(dateKey(o.created_at)).inflow += Number(o.total); });
  pagosReal.forEach(p => { getDay(dateKey(p.paid_at)).outflow += Number(p.amount); });
  gastosReal.forEach(g => { if (g.paid_at) getDay(dateKey(g.paid_at)).outflow += Number(g.amount); });
  ocProjected.forEach(oc => {
    if (!oc.due_date || !oc.total_cost) return;
    getDay(dateKey(oc.due_date)).projected_outflow += Number(oc.total_cost);
  });
  recurring.forEach(r => {
    for (let m = 0; m <= 1; m++) {
      const date = new Date(now.getFullYear(), now.getMonth() + m, r.day_of_month);
      if (date > now && date <= future30) {
        getDay(dateKey(date)).projected_outflow += Number(r.amount);
      }
    }
  });

  const allDays: DayEntry[] = [];
  for (let i = -30; i <= 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const key = dateKey(d);
    allDays.push(map.get(key) || { date: key, inflow: 0, outflow: 0, projected_outflow: 0 });
  }

  let balance = 0;
  const result = allDays.map(day => {
    const isPast = new Date(day.date) <= now;
    if (isPast) {
      balance += day.inflow - day.outflow;
    } else {
      balance -= day.projected_outflow;
    }
    return { ...day, balance, is_past: isPast };
  });

  return NextResponse.json({ days: result });
}
