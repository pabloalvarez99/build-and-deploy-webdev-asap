import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();

    const [total, noImage, noExternalId, noBarcode, outOfStock, lowStock] = await Promise.all([
      db.products.count({ where: { active: true } }),
      db.products.count({ where: { active: true, image_url: null } }),
      db.products.count({ where: { active: true, external_id: null } }),
      db.products.count({ where: { active: true, product_barcodes: { none: {} } } }),
      db.products.count({ where: { active: true, stock: 0 } }),
      db.products.count({ where: { active: true, stock: { gt: 0, lte: 10 } } }),
    ]);

    return NextResponse.json({ total, noImage, noExternalId, noBarcode, outOfStock, lowStock });
  } catch (e) {
    console.error('GET /api/admin/products/stats error:', e);
    return errorResponse('Error fetching stats', 500);
  }
}
