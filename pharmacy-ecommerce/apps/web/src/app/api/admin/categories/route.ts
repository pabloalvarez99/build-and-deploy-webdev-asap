import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();
    const db = await getDb();

    const category = await db.categories.create({
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description || null,
        image_url: body.image_url || null,
        active: body.active !== false,
      },
    });

    revalidateTag('categories');

    return NextResponse.json({
      ...category,
      created_at: category.created_at.toISOString(),
      updated_at: category.updated_at.toISOString(),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
