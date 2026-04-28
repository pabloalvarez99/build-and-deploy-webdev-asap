import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

function serializeGasto(g: Record<string, unknown>) {
  return {
    ...g,
    amount: g.amount != null ? Number(g.amount) : null,
    expense_date: g.expense_date instanceof Date ? g.expense_date.toISOString().split('T')[0] : g.expense_date,
    paid_at: g.paid_at instanceof Date ? g.paid_at.toISOString() : g.paid_at,
    updated_at: g.updated_at instanceof Date ? g.updated_at.toISOString() : g.updated_at,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const body = await request.json();

  const db = await getDb();
  const updated = await db.gastos.update({
    where: { id: params.id },
    data: {
      ...(body.category_id && { category_id: body.category_id }),
      ...(body.description && { description: body.description }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.expense_date && { expense_date: new Date(body.expense_date) }),
      ...('paid_at' in body && { paid_at: body.paid_at ? new Date(body.paid_at) : null }),
      ...('payment_method' in body && { payment_method: body.payment_method || null }),
    },
    include: { gasto_categories: true },
  });

  return NextResponse.json(serializeGasto(updated as unknown as Record<string, unknown>));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const db = await getDb();
  await db.gastos.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
