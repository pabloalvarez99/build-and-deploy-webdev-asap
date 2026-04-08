import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();
    const db = await getDb();

    const product = await db.products.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        price: parseFloat(body.price),
        stock: body.stock ?? 0,
        category_id: body.category_id || null,
        image_url: body.image_url || null,
        laboratory: body.laboratory || null,
        therapeutic_action: body.therapeutic_action || null,
        active_ingredient: body.active_ingredient || null,
        prescription_type: body.prescription_type || 'direct',
        presentation: body.presentation || null,
        discount_percent: body.discount_percent || null,
        active: body.active !== false,
      },
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
