import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { getDb } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = params;
    const body = await request.json();
    const { delta, reason } = body as { delta: number; reason: string };

    if (typeof delta !== 'number' || delta === 0) {
      return errorResponse('delta must be a non-zero number', 400);
    }
    const validReasons = ['reposicion', 'correccion', 'merma', 'inventario'];
    if (!validReasons.includes(reason)) {
      return errorResponse(`reason must be one of: ${validReasons.join(', ')}`, 400);
    }

    const db = await getDb();

    const product = await db.products.findUnique({ where: { id }, select: { id: true, stock: true } });
    if (!product) return errorResponse('Product not found', 404);

    const newStock = product.stock + delta;
    if (newStock < 0) return errorResponse('Stock no puede ser negativo', 400);

    const updated = await db.products.update({
      where: { id },
      data: { stock: newStock },
      select: { id: true, name: true, stock: true },
    });

    await db.stock_movements.create({
      data: { product_id: id, delta, reason, admin_id: admin.uid },
    });

    return NextResponse.json({ success: true, stock: updated.stock });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = params;
    const db = await getDb();

    const movements = await db.stock_movements.findMany({
      where: { product_id: id },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return NextResponse.json(
      movements.map((m) => ({
        id: m.id,
        delta: m.delta,
        reason: m.reason,
        created_at: m.created_at.toISOString(),
        admin_id: m.admin_id,
      }))
    );
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
