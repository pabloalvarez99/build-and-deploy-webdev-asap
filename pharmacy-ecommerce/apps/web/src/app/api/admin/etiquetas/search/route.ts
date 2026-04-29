import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = request.nextUrl;
    const q = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 50);

    const db = await getDb();

    const where = q
      ? {
          active: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' as const } },
            { active_ingredient: { contains: q, mode: 'insensitive' as const } },
            { laboratory: { contains: q, mode: 'insensitive' as const } },
            { external_id: { contains: q, mode: 'insensitive' as const } },
            { product_barcodes: { some: { barcode: { contains: q } } } },
          ],
        }
      : { active: true };

    const products = await db.products.findMany({
      where,
      orderBy: q ? { name: 'asc' } : { updated_at: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        price: true,
        discount_percent: true,
        external_id: true,
        presentation: true,
        laboratory: true,
        product_barcodes: { select: { barcode: true }, take: 1 },
      },
    });

    return NextResponse.json({
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.price),
        discount_percent: p.discount_percent ? Number(p.discount_percent) : null,
        external_id: p.external_id,
        presentation: p.presentation,
        laboratory: p.laboratory,
        barcode: p.product_barcodes[0]?.barcode || p.external_id || null,
      })),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
