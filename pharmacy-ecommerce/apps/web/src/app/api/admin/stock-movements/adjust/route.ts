import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { logAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { product_id, delta, notes } = await request.json();

    if (!product_id) return errorResponse('product_id requerido', 400);
    if (typeof delta !== 'number' || delta === 0) return errorResponse('delta debe ser un número distinto de 0', 400);

    const db = await getDb();

    const product = await db.products.findUnique({
      where: { id: product_id },
      select: { id: true, name: true, stock: true },
    });
    if (!product) return errorResponse('Producto no encontrado', 404);

    const newStock = product.stock + delta;
    if (newStock < 0) return errorResponse(`Stock resultante negativo (${newStock}). Ajuste el delta.`, 400);

    await db.$transaction(async (tx) => {
      await tx.products.update({
        where: { id: product_id },
        data: { stock: { increment: delta } },
      });

      await tx.stock_movements.create({
        data: {
          product_id,
          delta,
          reason: 'adjustment',
          admin_id: `${admin.email || admin.uid}${notes ? ` — ${notes}` : ''}`,
        },
      });
    });

    // Notificar faltas pendientes si el ajuste subió stock
    if (delta > 0) {
      await db.faltas.updateMany({
        where: { product_id, status: 'pending' },
        data: { status: 'notified', notified_at: new Date() },
      });
    }

    revalidateTag('products');
    logAudit(admin.email || admin.uid, 'create', 'stock_movement', product_id, product.name, {
      delta: { old: product.stock, new: newStock },
      notes: { old: null, new: notes ?? null },
    });
    return NextResponse.json({ success: true, new_stock: newStock, product_name: product.name });
  } catch (error) {
    console.error('Stock adjust error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
