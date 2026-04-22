import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json() as { active?: boolean; price?: number };
    const db = await getDb();

    const product = await db.products.findUnique({
      where: { id: params.id },
      select: { id: true, price: true, active: true, name: true },
    });
    if (!product) return errorResponse('Product not found', 404);

    const updateData: { active?: boolean; price?: number } = {};

    if (typeof body.price === 'number') {
      if (body.price < 0) return errorResponse('Price must be >= 0', 400);
      updateData.price = body.price;
    }

    if (typeof body.active === 'boolean') {
      // Prevent activating a product with no price
      const effectivePrice = updateData.price ?? Number(product.price);
      if (body.active && effectivePrice <= 0) {
        return errorResponse('No se puede activar un producto sin precio', 400);
      }
      updateData.active = body.active;
    }

    if (Object.keys(updateData).length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    const updated = await db.products.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, name: true, price: true, active: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
