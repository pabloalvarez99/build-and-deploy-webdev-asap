import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const body = await request.json();
    const db = await getDb();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = parseFloat(body.price);
    if (body.stock !== undefined) updateData.stock = body.stock;
    if (body.category_id !== undefined) updateData.category_id = body.category_id || null;
    if (body.image_url !== undefined) updateData.image_url = body.image_url || null;
    if (body.laboratory !== undefined) updateData.laboratory = body.laboratory || null;
    if (body.therapeutic_action !== undefined) updateData.therapeutic_action = body.therapeutic_action || null;
    if (body.active_ingredient !== undefined) updateData.active_ingredient = body.active_ingredient || null;
    if (body.prescription_type !== undefined) updateData.prescription_type = body.prescription_type;
    if (body.presentation !== undefined) updateData.presentation = body.presentation || null;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.discount_percent !== undefined) {
      updateData.discount_percent = body.discount_percent === 0 ? null : body.discount_percent || null;
    }

    const product = await db.products.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...product,
      price: product.price.toString(),
      created_at: product.created_at.toISOString(),
      updated_at: product.updated_at.toISOString(),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const db = await getDb();

    await db.products.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
