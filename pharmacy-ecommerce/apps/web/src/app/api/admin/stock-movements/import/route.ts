import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

interface StockRow {
  barcode?: string;
  external_id?: string;
  quantity: number; // new absolute quantity
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json() as { rows: StockRow[]; dry_run?: boolean };
    const { rows, dry_run = false } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return errorResponse('rows[] requerido', 400);
    }

    const db = await getDb();

    const barcodes = rows.map((r) => r.barcode).filter(Boolean) as string[];
    const externalIds = rows.map((r) => r.external_id).filter(Boolean) as string[];

    const [barcodeRecords, extIdProducts] = await Promise.all([
      barcodes.length > 0
        ? db.product_barcodes.findMany({ where: { barcode: { in: barcodes } }, select: { barcode: true, product_id: true } })
        : [],
      externalIds.length > 0
        ? db.products.findMany({ where: { external_id: { in: externalIds } }, select: { id: true, external_id: true } })
        : [],
    ]);

    const barcodeMap = new Map<string, string>(barcodeRecords.map((r) => [r.barcode, r.product_id] as [string, string]));
    const extIdMap = new Map<string, string>(extIdProducts.map((p) => [p.external_id!, p.id] as [string, string]));

    const resolved: { product_id: string; quantity: number; key: string }[] = [];
    const unmatched: string[] = [];

    for (const row of rows) {
      const key = row.barcode || row.external_id || '?';
      const product_id = (row.barcode && barcodeMap.get(row.barcode)) || (row.external_id && extIdMap.get(row.external_id));
      if (product_id) {
        resolved.push({ product_id, quantity: Math.max(0, Math.round(row.quantity)), key });
      } else {
        unmatched.push(key);
      }
    }

    // Fetch current stocks
    const productIds = Array.from(new Set(resolved.map((r) => r.product_id)));
    const current = await db.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, stock: true },
    });
    const currentMap = new Map(current.map((p) => [p.id, p]));

    if (dry_run) {
      return NextResponse.json({
        matched: resolved.length,
        unmatched: unmatched.length,
        unmatched_keys: unmatched.slice(0, 20),
        preview: resolved.slice(0, 100).map((r) => {
          const cur = currentMap.get(r.product_id);
          return {
            product_id: r.product_id,
            name: cur?.name ?? '?',
            old_stock: cur?.stock ?? null,
            new_stock: r.quantity,
            delta: cur != null ? r.quantity - cur.stock : null,
            key: r.key,
          };
        }),
      });
    }

    // Apply in batches
    let updated = 0;
    const adminId = admin.uid;
    const batchSize = 50;

    for (let i = 0; i < resolved.length; i += batchSize) {
      const batch = resolved.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (r) => {
          const cur = currentMap.get(r.product_id);
          const delta = cur != null ? r.quantity - cur.stock : 0;

          await db.$transaction([
            db.products.update({
              where: { id: r.product_id },
              data: { stock: r.quantity },
            }),
            // Only log movement if there's an actual change
            ...(delta !== 0
              ? [db.stock_movements.create({
                  data: {
                    product_id: r.product_id,
                    delta,
                    reason: 'adjustment',
                    admin_id: adminId,
                  },
                })]
              : []),
          ]);
        })
      );
      updated += batch.length;
    }

    return NextResponse.json({
      updated,
      unmatched: unmatched.length,
      unmatched_keys: unmatched.slice(0, 20),
    });
  } catch (e) {
    console.error('POST /api/admin/stock-movements/import error:', e);
    return errorResponse('Error importando stock', 500);
  }
}
