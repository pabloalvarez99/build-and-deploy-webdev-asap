import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const sp = request.nextUrl.searchParams;
    const page = parseInt(sp.get('page') || '1');
    const limit = parseInt(sp.get('limit') || '50');
    const product_id = sp.get('product_id') || undefined;
    const reason = sp.get('reason') || undefined;
    const offset = (page - 1) * limit;

    const where = {
      ...(product_id ? { product_id } : {}),
      ...(reason ? { reason } : {}),
    };

    const db = await getDb();
    const [movements, total] = await Promise.all([
      db.stock_movements.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
        include: {
          products: { select: { id: true, name: true, slug: true } },
        },
      }),
      db.stock_movements.count({ where }),
    ]);

    return NextResponse.json({
      movements: movements.map((m) => ({
        ...m,
        created_at: m.created_at instanceof Date ? m.created_at.toISOString() : m.created_at,
      })),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
