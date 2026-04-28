import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET() {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const db = await getDb();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [pendingAP, totalAP, gastosThisMonth, ingresosMes, overdueAP] = await Promise.all([
    db.purchase_orders.count({ where: { status: 'received', paid: false } }),
    db.purchase_orders.aggregate({
      where: { status: 'received', paid: false },
      _sum: { total_cost: true },
    }),
    db.gastos.aggregate({
      where: { expense_date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    db.orders.aggregate({
      where: {
        status: { in: ['paid', 'completed'] },
        created_at: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { total: true },
    }),
    db.purchase_orders.count({
      where: { status: 'received', paid: false, due_date: { lt: now } },
    }),
  ]);

  return NextResponse.json({
    pending_ap_count: pendingAP,
    pending_ap_amount: totalAP._sum.total_cost ? Number(totalAP._sum.total_cost) : 0,
    gastos_mes: gastosThisMonth._sum.amount ? Number(gastosThisMonth._sum.amount) : 0,
    ingresos_mes: ingresosMes._sum.total ? Number(ingresosMes._sum.total) : 0,
    overdue_ap_count: overdueAP,
  });
}
