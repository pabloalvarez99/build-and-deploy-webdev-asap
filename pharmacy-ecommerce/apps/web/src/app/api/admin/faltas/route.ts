import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const db = await getDb();
    const faltas = await db.faltas.findMany({
      where: status ? { status } : undefined,
      include: { products: { select: { name: true, slug: true, stock: true } } },
      orderBy: { created_at: 'desc' },
    });

    const pendingCount = status
      ? undefined
      : await db.faltas.count({ where: { status: 'pending' } });

    return NextResponse.json({ faltas, pendingCount });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json() as {
      product_id?: string;
      product_name: string;
      customer_name?: string;
      customer_phone?: string;
      quantity?: number;
      notes?: string;
    };

    if (!body.product_name) return errorResponse('product_name required', 400);

    const db = await getDb();
    const falta = await db.faltas.create({
      data: {
        product_id: body.product_id || null,
        product_name: body.product_name,
        customer_name: body.customer_name || null,
        customer_phone: body.customer_phone || null,
        quantity: body.quantity || 1,
        notes: body.notes || null,
        status: 'pending',
      },
    });

    return NextResponse.json(falta, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
