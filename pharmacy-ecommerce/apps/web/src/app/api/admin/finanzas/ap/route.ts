import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

function serialize(po: Record<string, unknown>) {
  return {
    ...po,
    total_cost: po.total_cost != null ? Number(po.total_cost) : null,
    invoice_date: po.invoice_date instanceof Date ? po.invoice_date.toISOString() : po.invoice_date,
    due_date: po.due_date instanceof Date ? po.due_date.toISOString() : po.due_date,
    paid_at: po.paid_at instanceof Date ? po.paid_at.toISOString() : po.paid_at,
    created_at: po.created_at instanceof Date ? po.created_at.toISOString() : po.created_at,
    purchase_payments: Array.isArray(po.purchase_payments)
      ? (po.purchase_payments as Record<string, unknown>[]).map(p => ({
          ...p,
          amount: p.amount != null ? Number(p.amount) : null,
          paid_at: p.paid_at instanceof Date ? p.paid_at.toISOString() : p.paid_at,
          created_at: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
        }))
      : po.purchase_payments,
  };
}

export async function GET(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const sp = request.nextUrl.searchParams;
  const paid = sp.get('paid');
  const page = parseInt(sp.get('page') || '1');
  const limit = parseInt(sp.get('limit') || '20');
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = { status: 'received' };
  if (paid === 'true') where.paid = true;
  if (paid === 'false') where.paid = false;

  const db = await getDb();
  const [orders, total] = await Promise.all([
    db.purchase_orders.findMany({
      where,
      orderBy: [{ paid: 'asc' }, { due_date: 'asc' }, { created_at: 'desc' }],
      skip: offset,
      take: limit,
      include: {
        suppliers: { select: { id: true, name: true } },
        purchase_payments: { orderBy: { paid_at: 'desc' } },
      },
    }),
    db.purchase_orders.count({ where }),
  ]);

  return NextResponse.json({
    orders: orders.map(o => serialize(o as unknown as Record<string, unknown>)),
    total,
    page,
    limit,
  });
}

export async function PATCH(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const { id, due_date } = await request.json();
  if (!id) return errorResponse('id requerido', 400);

  const db = await getDb();
  const updated = await db.purchase_orders.update({
    where: { id },
    data: { due_date: due_date ? new Date(due_date) : null },
  });

  return NextResponse.json(serialize(updated as unknown as Record<string, unknown>));
}
