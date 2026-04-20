import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // 'expired' | 'soon30' | 'soon90'

    const db = await getDb();
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    let where = {};
    if (filter === 'expired') where = { expiry_date: { lt: now } };
    else if (filter === 'soon30') where = { expiry_date: { gte: now, lte: in30 } };
    else if (filter === 'soon90') where = { expiry_date: { gte: now, lte: in90 } };

    const batches = await db.product_batches.findMany({
      where,
      include: {
        products: {
          select: {
            id: true, name: true, slug: true, stock: true, discount_percent: true,
            categories: { select: { name: true } },
          },
        },
      },
      orderBy: { expiry_date: 'asc' },
    });

    const allBatches = await db.product_batches.findMany({ select: { expiry_date: true } });
    const summary = {
      expired: allBatches.filter((b) => b.expiry_date < now).length,
      soon30: allBatches.filter((b) => b.expiry_date >= now && b.expiry_date <= in30).length,
      soon90: allBatches.filter((b) => b.expiry_date >= now && b.expiry_date <= in90).length,
      total: allBatches.length,
    };

    return NextResponse.json({ batches, summary });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json() as {
      product_id: string;
      batch_code?: string;
      expiry_date: string;
      quantity: number;
      notes?: string;
    };

    if (!body.product_id || !body.expiry_date || !body.quantity) {
      return errorResponse('product_id, expiry_date, quantity required', 400);
    }

    const db = await getDb();
    const batch = await db.product_batches.create({
      data: {
        product_id: body.product_id,
        batch_code: body.batch_code || null,
        expiry_date: new Date(body.expiry_date),
        quantity: body.quantity,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
