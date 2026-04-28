import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET() {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const db = await getDb();
  const [recurring, categories] = await Promise.all([
    db.recurring_expenses.findMany({
      orderBy: { created_at: 'desc' },
      include: { gasto_categories: true },
    }),
    db.gasto_categories.findMany({ orderBy: { sort_order: 'asc' } }),
  ]);

  return NextResponse.json({ recurring, categories });
}

export async function POST(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const { category_id, description, amount, day_of_month } = await request.json();
  if (!category_id || !description || !amount || !day_of_month) {
    return errorResponse('category_id, description, amount, day_of_month requeridos', 400);
  }
  if (day_of_month < 1 || day_of_month > 28) {
    return errorResponse('day_of_month debe ser entre 1 y 28', 400);
  }

  const db = await getDb();
  const rec = await db.recurring_expenses.create({
    data: { category_id, description, amount, day_of_month, created_by: owner.email || owner.uid },
    include: { gasto_categories: true },
  });

  return NextResponse.json(rec, { status: 201 });
}
