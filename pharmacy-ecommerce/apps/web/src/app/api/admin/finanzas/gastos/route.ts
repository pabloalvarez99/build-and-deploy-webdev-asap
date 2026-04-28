import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

function serializeGasto(g: Record<string, unknown>) {
  return {
    ...g,
    amount: g.amount != null ? Number(g.amount) : null,
    expense_date: g.expense_date instanceof Date ? g.expense_date.toISOString().split('T')[0] : g.expense_date,
    paid_at: g.paid_at instanceof Date ? g.paid_at.toISOString() : g.paid_at,
    created_at: g.created_at instanceof Date ? g.created_at.toISOString() : g.created_at,
  };
}

export async function GET(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const sp = request.nextUrl.searchParams;
  const page = parseInt(sp.get('page') || '1');
  const limit = parseInt(sp.get('limit') || '30');
  const month = sp.get('month');
  const category_id = sp.get('category_id') || undefined;
  const offset = (page - 1) * limit;

  const db = await getDb();
  const where: Record<string, unknown> = {};
  if (category_id) where.category_id = category_id;
  if (month) {
    const [y, m] = month.split('-').map(Number);
    where.expense_date = {
      gte: new Date(y, m - 1, 1),
      lte: new Date(y, m, 0),
    };
  }

  const [gastos, total, categories] = await Promise.all([
    db.gastos.findMany({
      where,
      orderBy: { expense_date: 'desc' },
      skip: offset,
      take: limit,
      include: { gasto_categories: true },
    }),
    db.gastos.count({ where }),
    db.gasto_categories.findMany({ orderBy: { sort_order: 'asc' } }),
  ]);

  return NextResponse.json({
    gastos: gastos.map(g => serializeGasto(g as unknown as Record<string, unknown>)),
    total,
    page,
    limit,
    categories,
  });
}

export async function POST(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const body = await request.json();
  const { category_id, description, amount, expense_date, paid_at, payment_method } = body;

  if (!category_id || !description || !amount || !expense_date) {
    return errorResponse('category_id, description, amount, expense_date requeridos', 400);
  }

  const db = await getDb();
  const gasto = await db.gastos.create({
    data: {
      category_id,
      description,
      amount,
      expense_date: new Date(expense_date),
      paid_at: paid_at ? new Date(paid_at) : null,
      payment_method: payment_method || null,
      created_by: owner.email || owner.uid,
    },
    include: { gasto_categories: true },
  });

  return NextResponse.json(serializeGasto(gasto as unknown as Record<string, unknown>), { status: 201 });
}
