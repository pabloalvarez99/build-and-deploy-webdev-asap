import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

// POST: asigna scan-fail a producto existente.
// Body: { barcode, product_id }
// Crea row en product_barcodes (skip si UNIQUE collision en otro producto → error).
// Marca unknown_barcode_scans como resuelto.
export async function POST(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await req.json().catch(() => ({}));
    const barcode = String(body.barcode ?? '').trim();
    const product_id = String(body.product_id ?? '').trim();
    if (!barcode || !product_id) return errorResponse('barcode and product_id required', 400);

    const db = await getDb();

    const existing = await db.product_barcodes.findUnique({ where: { barcode } });
    if (existing && existing.product_id !== product_id) {
      const other = await db.products.findUnique({ where: { id: existing.product_id }, select: { name: true } });
      return errorResponse(`Código ya asignado a otro producto: ${other?.name ?? existing.product_id}`, 409);
    }

    if (!existing) {
      await db.product_barcodes.create({ data: { barcode, product_id } });
    }

    await db.unknown_barcode_scans.update({
      where: { barcode },
      data: { resolved_at: new Date(), resolved_product_id: product_id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/admin/barcodes/unknown/resolve error:', e);
    return errorResponse('Error', 500);
  }
}
