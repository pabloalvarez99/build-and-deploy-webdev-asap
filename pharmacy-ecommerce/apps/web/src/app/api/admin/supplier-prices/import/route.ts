import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import * as XLSX from 'xlsx';

function parsePrice(val: unknown): number | null {
  if (!val) return null;
  const s = String(val).replace(/\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : Math.round(n);
}

function cleanText(val: unknown): string {
  if (!val) return '';
  return String(val).trim();
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const supplierId = formData.get('supplier_id') as string | null;

    if (!file) return errorResponse('Archivo requerido', 400);
    if (!supplierId) return errorResponse('supplier_id requerido', 400);

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[];

    if (rows.length === 0) return errorResponse('El archivo no contiene datos', 400);

    const db = await getDb();

    // Verify supplier exists
    const supplier = await db.suppliers.findUnique({ where: { id: supplierId } });
    if (!supplier) return errorResponse('Proveedor no encontrado', 404);

    // Load supplier_product_mappings for this supplier
    const mappings = await db.supplier_product_mappings.findMany({
      where: { supplier_id: supplierId },
      select: { supplier_code: true, product_id: true },
    });
    const codeToProductId = new Map(mappings.map(m => [m.supplier_code.toLowerCase(), m.product_id]));

    // Also load products by name for fallback matching
    const allProducts = await db.products.findMany({
      select: { id: true, name: true },
      where: { active: true },
    });
    const nameToProductId = new Map(allProducts.map(p => [p.name.toLowerCase().trim(), p.id]));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      const supplierCode = cleanText(row['codigo'] || row['supplier_code'] || row['Código'] || row['Codigo'] || '');
      const productName = cleanText(row['producto'] || row['product_name'] || row['Producto'] || row['nombre'] || row['Nombre'] || '');
      const priceRaw = row['precio'] || row['price'] || row['Precio'] || row['unit_price'] || row['precio_unitario'] || '';
      const notes = cleanText(row['notas'] || row['notes'] || row['Notas'] || '');

      const price = parsePrice(priceRaw);
      if (!price || price <= 0) {
        skipped++;
        continue;
      }

      // Resolve product_id: supplier_code first, then product name
      let productId: string | undefined;
      if (supplierCode) {
        productId = codeToProductId.get(supplierCode.toLowerCase());
      }
      if (!productId && productName) {
        productId = nameToProductId.get(productName.toLowerCase().trim());
      }

      if (!productId) {
        if (supplierCode || productName) {
          errors.push(`No encontrado: "${supplierCode || productName}"`);
        }
        skipped++;
        continue;
      }

      // Upsert
      const existing = await db.supplier_price_lists.findFirst({
        where: { supplier_id: supplierId, product_id: productId },
      });

      const data = {
        supplier_id: supplierId,
        product_id: productId,
        unit_price: price,
        valid_from: today,
        valid_until: null as Date | null,
        notes: notes || null,
      };

      if (existing) {
        await db.supplier_price_lists.update({ where: { id: existing.id }, data });
      } else {
        await db.supplier_price_lists.create({ data });
      }
      imported++;
    }

    return NextResponse.json({
      imported,
      skipped,
      errors: errors.slice(0, 20),
      total_rows: rows.length,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
