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
    if (body.image_url !== undefined) updateData.image_url = body.image_url || null;
    if (body.active !== undefined) updateData.active = body.active;

    const category = await db.categories.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...category,
      created_at: category.created_at.toISOString(),
      updated_at: category.updated_at.toISOString(),
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

    const productCount = await db.products.count({
      where: { category_id: id },
    });

    if (productCount > 0) {
      return errorResponse(`Hay ${productCount} productos en esta categoría`, 400);
    }

    await db.categories.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
