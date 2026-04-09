import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const db = await getDb();

    // Verificar que la OC existe y está en draft
    const order = await db.purchase_orders.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) return errorResponse('Order not found', 404);
    if (order.status !== 'draft') {
      return errorResponse(`No se puede confirmar: la orden está en estado '${order.status}'`, 409);
    }

    const mappedItems = order.items.filter((item) => item.product_id !== null);
    if (mappedItems.length === 0) {
      return errorResponse('No hay items con productos mapeados para actualizar stock', 400);
    }

    // Transacción: stock++, cost_price, stock_movements, nuevos mappings, OC → received
    await db.$transaction(async (tx) => {
      for (const item of mappedItems) {
        if (!item.product_id) continue;

        // Incrementar stock
        await tx.products.update({
          where: { id: item.product_id },
          data: {
            stock: { increment: item.quantity },
            cost_price: item.unit_cost, // actualizar con el costo más reciente
          },
        });

        // Registrar movimiento de stock
        await tx.stock_movements.create({
          data: {
            product_id: item.product_id,
            delta: item.quantity,
            reason: 'purchase',
            admin_id: admin.email || admin.uid,
          },
        });

        // Guardar mapping supplier_code → product_id si hay código de proveedor
        if (item.supplier_product_code) {
          await tx.supplier_product_mappings.upsert({
            where: {
              supplier_id_supplier_code: {
                supplier_id: order.supplier_id,
                supplier_code: item.supplier_product_code,
              },
            },
            update: { product_id: item.product_id },
            create: {
              supplier_id: order.supplier_id,
              supplier_code: item.supplier_product_code,
              product_id: item.product_id,
            },
          });
        }
      }

      // Marcar OC como recibida
      await tx.purchase_orders.update({
        where: { id },
        data: { status: 'received' },
      });
    });

    return NextResponse.json({
      success: true,
      items_updated: mappedItems.length,
      items_skipped: order.items.length - mappedItems.length,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
