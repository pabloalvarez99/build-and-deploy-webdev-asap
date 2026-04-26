import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(10, parseInt(searchParams.get('limit') || '50')));
    const offset = (page - 1) * limit;
    const q = (searchParams.get('q') || '').trim();
    const status = searchParams.get('status') || 'all'; // all | active | inactive | noprice

    const db = await getDb();

    // Build WHERE conditions
    let whereClause = `p.external_id IS NOT NULL`;
    const params: (string | number | boolean)[] = [];
    let paramIdx = 1;

    if (q) {
      // Search by name, external_id, or barcode
      whereClause += ` AND (
        p.name ILIKE $${paramIdx}
        OR p.external_id = $${paramIdx + 1}
        OR EXISTS (
          SELECT 1 FROM product_barcodes pb2
          WHERE pb2.product_id = p.id AND pb2.barcode = $${paramIdx + 2}
        )
      )`;
      params.push(`%${q}%`, q, q);
      paramIdx += 3;
    }

    if (status === 'active') {
      whereClause += ` AND p.active = true`;
    } else if (status === 'inactive') {
      whereClause += ` AND p.active = false`;
    } else if (status === 'noprice') {
      whereClause += ` AND p.price = 0`;
    }

    // Total count
    const countResult = await db.$queryRawUnsafe<[{ total: bigint }]>(
      `SELECT COUNT(p.id) AS total
       FROM products p
       WHERE ${whereClause}`,
      ...params
    );
    const total = Number(countResult[0]?.total ?? 0);

    // Products with barcodes
    const rows = await db.$queryRawUnsafe<Array<{
      id: string;
      external_id: string;
      name: string;
      price: string;
      active: boolean;
      stock: number;
      image_url: string | null;
      barcode_count: number;
      barcodes: string[] | null;
    }>>(
      `SELECT
         p.id::text,
         p.external_id,
         p.name,
         p.price::text,
         p.active,
         p.stock,
         p.image_url,
         COUNT(pb.barcode)::int AS barcode_count,
         array_agg(pb.barcode ORDER BY pb.barcode) FILTER (WHERE pb.barcode IS NOT NULL) AS barcodes
       FROM products p
       LEFT JOIN product_barcodes pb ON pb.product_id = p.id
       WHERE ${whereClause}
       GROUP BY p.id, p.external_id, p.name, p.price, p.active, p.stock, p.image_url
       ORDER BY p.name ASC
       LIMIT ${limit} OFFSET ${offset}`,
      ...params
    );

    // Stats (always the full ERP catalog breakdown)
    const statsResult = await db.$queryRaw<[{
      total: bigint;
      active: bigint;
      inactive: bigint;
      noprice: bigint;
    }]>`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN active = true THEN 1 ELSE 0 END) AS active,
        SUM(CASE WHEN active = false THEN 1 ELSE 0 END) AS inactive,
        SUM(CASE WHEN price = 0 THEN 1 ELSE 0 END) AS noprice
      FROM products
      WHERE external_id IS NOT NULL
    `;

    const stats = {
      total: Number(statsResult[0]?.total ?? 0),
      active: Number(statsResult[0]?.active ?? 0),
      inactive: Number(statsResult[0]?.inactive ?? 0),
      noprice: Number(statsResult[0]?.noprice ?? 0),
    };

    return NextResponse.json({
      products: rows.map((r) => ({
        ...r,
        price: parseFloat(r.price),
        image_url: r.image_url ?? null,
        barcodes: r.barcodes ?? [],
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
      stats,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
