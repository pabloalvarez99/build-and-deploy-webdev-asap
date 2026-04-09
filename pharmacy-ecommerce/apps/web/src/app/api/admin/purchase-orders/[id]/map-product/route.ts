import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

// Guarda o actualiza el mapeo supplier_code → product_id y actualiza el item de la OC
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const body = await request.json();
    const { item_id, product_id } = body;

    if (!item_id) return errorResponse('item_id is required', 400);
    if (!product_id) return errorResponse('product_id is required', 400);

    const db = await getDb();

    // Verificar que el item pertenece a esta OC
    const item = await db.purchase_order_items.findFirst({
      where: { id: item_id, purchase_order_id: id },
    });
    if (!item) return errorResponse('Item not found', 404);

    // Actualizar el item con el product_id mapeado
    const updatedItem = await db.purchase_order_items.update({
      where: { id: item_id },
      data: { product_id },
    });

    // Guardar el mapping para futuras facturas si hay código de proveedor
    if (item.supplier_product_code) {
      const order = await db.purchase_orders.findUnique({
        where: { id },
        select: { supplier_id: true },
      });

      if (order) {
        await db.supplier_product_mappings.upsert({
          where: {
            supplier_id_supplier_code: {
              supplier_id: order.supplier_id,
              supplier_code: item.supplier_product_code,
            },
          },
          update: { product_id },
          create: {
            supplier_id: order.supplier_id,
            supplier_code: item.supplier_product_code,
            product_id,
          },
        });
      }
    }

    return NextResponse.json({
      ...updatedItem,
      unit_cost: updatedItem.unit_cost.toString(),
      subtotal: updatedItem.subtotal.toString(),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
