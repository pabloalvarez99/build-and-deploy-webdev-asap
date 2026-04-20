import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const sp = request.nextUrl.searchParams;
    const productId = sp.get('product_id');
    const minSuppliers = productId ? 1 : 2;

    const db = await getDb();

    // Get all prices grouped by product
    const prices = await db.supplier_price_lists.findMany({
      where: productId ? { product_id: productId } : undefined,
      include: {
        suppliers: { select: { id: true, name: true } },
        products: { select: { id: true, name: true, price: true, cost_price: true, stock: true } },
      },
      orderBy: { unit_price: 'asc' },
    });

    // Group by product
    const byProduct = new Map<string, typeof prices>();
    for (const p of prices) {
      const arr = byProduct.get(p.product_id) ?? [];
      arr.push(p);
      byProduct.set(p.product_id, arr);
    }

    type CompareRow = {
      product_id: string;
      product_name: string;
      product_price: number | null;
      stock: number;
      suppliers: {
        supplier_id: string;
        supplier_name: string;
        unit_price: number;
        valid_from: string;
        valid_until: string | null;
        notes: string | null;
        is_best: boolean;
      }[];
      best_supplier: string;
      best_price: number;
      worst_price: number;
      saving_pct: number;
    };

    // Build comparison rows — only products with ≥ minSuppliers
    const rows: CompareRow[] = [];
    for (const entries of Array.from(byProduct.values())) {
      if (entries.length < minSuppliers) continue;
      const sorted = [...entries].sort((a, b) => Number(a.unit_price) - Number(b.unit_price));
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      const savingPct = worst !== best
        ? Math.round(((Number(worst.unit_price) - Number(best.unit_price)) / Number(worst.unit_price)) * 100)
        : 0;

      rows.push({
        product_id: entries[0].product_id,
        product_name: entries[0].products?.name ?? '—',
        product_price: entries[0].products ? Number(entries[0].products.price) : null,
        stock: entries[0].products?.stock ?? 0,
        suppliers: sorted.map(e => ({
          supplier_id: e.supplier_id,
          supplier_name: e.suppliers.name,
          unit_price: Number(e.unit_price),
          valid_from: e.valid_from.toISOString().split('T')[0],
          valid_until: e.valid_until ? e.valid_until.toISOString().split('T')[0] : null,
          notes: e.notes,
          is_best: e.id === best.id,
        })),
        best_supplier: best.suppliers.name,
        best_price: Number(best.unit_price),
        worst_price: Number(worst.unit_price),
        saving_pct: savingPct,
      });
    }

    // Sort by saving_pct descending (biggest savings first)
    rows.sort((a, b) => b.saving_pct - a.saving_pct);

    return NextResponse.json({ rows, total: rows.length });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
