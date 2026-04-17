import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

// PUT /api/admin/purchase-orders/[id]/items
// Updates quantity and unit_cost for one or more items on a draft purchase order.
// Recalculates subtotals and total_cost atomically.
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();
    const order = await db.purchase_orders.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!order) return errorResponse('Orden no encontrada', 404);
    if (order.status !== 'draft') return errorResponse('Solo se pueden editar órdenes en borrador', 400);

    const body = await request.json() as { items: { id: string; quantity: number; unit_cost: number }[] };
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return errorResponse('items[] requerido', 400);
    }

    // Update each item's quantity, unit_cost, subtotal in a transaction
    await db.$transaction(
      items.map((item) => {
        const subtotal = Math.round(item.quantity) * Number(item.unit_cost);
        return db.purchase_order_items.update({
          where: { id: item.id },
          data: {
            quantity: Math.max(1, Math.round(item.quantity)),
            unit_cost: Number(item.unit_cost),
            subtotal,
          },
        });
      })
    );

    // Recalculate total_cost from all items
    const allItems = await db.purchase_order_items.findMany({
      where: { purchase_order_id: params.id },
      select: { subtotal: true },
    });
    const totalCost = allItems.reduce((s, i) => s + Number(i.subtotal), 0);

    await db.purchase_orders.update({
      where: { id: params.id },
      data: { total_cost: totalCost },
    });

    return NextResponse.json({ ok: true, total_cost: totalCost });
  } catch (e) {
    console.error('PUT /api/admin/purchase-orders/[id]/items error:', e);
    return errorResponse('Error actualizando items', 500);
  }
}

// DELETE /api/admin/purchase-orders/[id]/items?item_id=xxx
// Removes a single item from a draft PO and recalculates total_cost.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();
    const order = await db.purchase_orders.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });

    if (!order) return errorResponse('Orden no encontrada', 404);
    if (order.status !== 'draft') return errorResponse('Solo se pueden editar órdenes en borrador', 400);

    const itemId = request.nextUrl.searchParams.get('item_id');
    if (!itemId) return errorResponse('item_id requerido', 400);

    // Check this item belongs to this order
    const item = await db.purchase_order_items.findFirst({
      where: { id: itemId, purchase_order_id: params.id },
    });
    if (!item) return errorResponse('Item no encontrado', 404);

    await db.purchase_order_items.delete({ where: { id: itemId } });

    // Recalculate total_cost
    const allItems = await db.purchase_order_items.findMany({
      where: { purchase_order_id: params.id },
      select: { subtotal: true },
    });
    const totalCost = allItems.reduce((s, i) => s + Number(i.subtotal), 0);

    await db.purchase_orders.update({
      where: { id: params.id },
      data: { total_cost: totalCost },
    });

    return NextResponse.json({ ok: true, total_cost: totalCost });
  } catch (e) {
    console.error('DELETE /api/admin/purchase-orders/[id]/items error:', e);
    return errorResponse('Error eliminando item', 500);
  }
}
