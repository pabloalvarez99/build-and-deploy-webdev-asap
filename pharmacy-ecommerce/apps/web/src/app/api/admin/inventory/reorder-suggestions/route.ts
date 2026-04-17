import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();

    // Get low_stock_threshold from admin_settings
    const thresholdSetting = await db.admin_settings.findUnique({
      where: { key: 'low_stock_threshold' },
    });
    const threshold = thresholdSetting ? parseInt(thresholdSetting.value) : 10;

    // Fetch active products at or below threshold that have a supplier mapping
    const products = await db.products.findMany({
      where: {
        active: true,
        stock: { lte: threshold },
        supplier_product_mappings: { some: {} },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
        cost_price: true,
        supplier_product_mappings: {
          select: {
            supplier_code: true,
            supplier_id: true,
            suppliers: {
              select: { id: true, name: true, contact_name: true, contact_email: true, contact_phone: true },
            },
          },
        },
      },
      orderBy: { stock: 'asc' },
    });

    type SupplierInfo = { id: string; name: string; contact_name: string | null; contact_email: string | null; contact_phone: string | null };
    type ItemInfo = { product_id: string; name: string; stock: number; price: number; cost_price: number | null; supplier_code: string };

    const supplierMap = new Map<string, { supplier: SupplierInfo; items: ItemInfo[] }>();

    for (const p of products) {
      for (const mapping of p.supplier_product_mappings) {
        const sid = mapping.supplier_id;
        if (!supplierMap.has(sid)) {
          supplierMap.set(sid, { supplier: mapping.suppliers, items: [] });
        }
        const group = supplierMap.get(sid)!;
        if (!group.items.find((i) => i.product_id === p.id)) {
          group.items.push({
            product_id: p.id,
            name: p.name,
            stock: p.stock,
            price: p.price != null ? Number(p.price) : 0,
            cost_price: p.cost_price != null ? Number(p.cost_price) : null,
            supplier_code: mapping.supplier_code,
          });
        }
      }
    }

    const groups = Array.from(supplierMap.values()).map((g) => ({
      supplier: g.supplier,
      items: g.items,
    }));

    return NextResponse.json({ threshold, groups, total_products: products.length });
  } catch (e) {
    console.error('GET /api/admin/inventory/reorder-suggestions error:', e);
    return errorResponse('Error cargando sugerencias', 500);
  }
}
