import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const body = await request.json();
  const db = await getDb();
  const updated = await db.recurring_expenses.update({
    where: { id: params.id },
    data: {
      ...(body.description && { description: body.description }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.day_of_month && { day_of_month: body.day_of_month }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.category_id && { category_id: body.category_id }),
    },
    include: { gasto_categories: true },
  });
  return NextResponse.json(updated);
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const db = await getDb();
  const rec = await db.recurring_expenses.findUnique({ where: { id: params.id } });
  if (!rec) return errorResponse('Plantilla no encontrada', 404);

  const now = new Date();
  const expenseDate = new Date(now.getFullYear(), now.getMonth(), rec.day_of_month);

  const gasto = await db.gastos.create({
    data: {
      category_id: rec.category_id,
      description: rec.description,
      amount: rec.amount,
      expense_date: expenseDate,
      recurring_expense_id: rec.id,
      created_by: owner.email || owner.uid,
    },
    include: { gasto_categories: true },
  });

  return NextResponse.json(gasto, { status: 201 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const db = await getDb();
  await db.recurring_expenses.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
