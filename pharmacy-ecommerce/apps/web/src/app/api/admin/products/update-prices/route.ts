import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

interface PriceRow {
  barcode?: string;
  external_id?: string;
  price: number;
  cost_price?: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json() as { rows: PriceRow[]; dry_run?: boolean };
    const { rows, dry_run = false } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return errorResponse('rows[] requerido', 400);
    }

    const db = await getDb();

    // Build lookup maps: barcode → product_id and external_id → product_id
    const barcodes = rows.map(r => r.barcode).filter(Boolean) as string[];
    const externalIds = rows.map(r => r.external_id).filter(Boolean) as string[];

    const [barcodeRecords, extIdProducts] = await Promise.all([
      barcodes.length > 0
        ? db.product_barcodes.findMany({ where: { barcode: { in: barcodes } }, select: { barcode: true, product_id: true } })
        : [],
      externalIds.length > 0
        ? db.products.findMany({ where: { external_id: { in: externalIds } }, select: { id: true, external_id: true, name: true, price: true, cost_price: true } })
        : [],
    ]);

    const barcodeMap = new Map<string, string>(barcodeRecords.map(r => [r.barcode, r.product_id] as [string, string]));
    const extIdMap = new Map<string, string>(extIdProducts.map(p => [p.external_id!, p.id] as [string, string]));

    // Resolve product IDs for each row
    const resolved: { product_id: string; price: number; cost_price?: number | null; key: string }[] = [];
    const unmatched: string[] = [];

    for (const row of rows) {
      const key = row.barcode || row.external_id || '?';
      const product_id = (row.barcode && barcodeMap.get(row.barcode)) || (row.external_id && extIdMap.get(row.external_id));
      if (product_id) {
        resolved.push({ product_id, price: Math.round(row.price), cost_price: row.cost_price ?? null, key });
      } else {
        unmatched.push(key);
      }
    }

    if (dry_run) {
      // Fetch current prices for preview
      const productIds = Array.from(new Set(resolved.map(r => r.product_id)));
      const current = await db.products.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, cost_price: true },
      });
      const currentMap = new Map(current.map(p => [p.id, p]));

      return NextResponse.json({
        matched: resolved.length,
        unmatched: unmatched.length,
        unmatched_keys: unmatched.slice(0, 20),
        preview: resolved.slice(0, 100).map(r => {
          const cur = currentMap.get(r.product_id);
          return {
            product_id: r.product_id,
            name: cur?.name ?? '?',
            old_price: cur?.price != null ? Number(cur.price) : null,
            new_price: r.price,
            old_cost: cur?.cost_price != null ? Number(cur.cost_price) : null,
            new_cost: r.cost_price ?? null,
            key: r.key,
          };
        }),
      });
    }

    // Apply updates in batches of 100
    let updated = 0;
    const batchSize = 100;
    for (let i = 0; i < resolved.length; i += batchSize) {
      const batch = resolved.slice(i, i + batchSize);
      await Promise.all(batch.map(r =>
        db.products.update({
          where: { id: r.product_id },
          data: {
            price: r.price,
            ...(r.cost_price != null ? { cost_price: r.cost_price } : {}),
          },
        })
      ));
      updated += batch.length;
    }

    revalidateTag('products');
    return NextResponse.json({
      updated,
      unmatched: unmatched.length,
      unmatched_keys: unmatched.slice(0, 20),
    });
  } catch (e) {
    console.error('POST /api/admin/products/update-prices error:', e);
    return errorResponse('Error actualizando precios', 500);
  }
}
