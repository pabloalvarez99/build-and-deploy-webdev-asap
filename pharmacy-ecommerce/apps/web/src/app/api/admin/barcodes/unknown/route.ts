import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

// GET: lista scan-fails pendientes (no resueltos). Orden: scan_count DESC.
export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);
    const db = await getDb();
    const rows = await db.unknown_barcode_scans.findMany({
      where: { resolved_at: null },
      orderBy: [{ scan_count: 'desc' }, { last_scanned_at: 'desc' }],
      take: 200,
    });
    return NextResponse.json({ items: rows });
  } catch (e) {
    console.error('GET /api/admin/barcodes/unknown error:', e);
    return errorResponse('Error', 500);
  }
}

// DELETE: marca como resuelto sin asignar producto (falso positivo / ignorar).
// Body: { barcode }
export async function DELETE(req: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);
    const body = await req.json().catch(() => ({}));
    const barcode = String(body.barcode ?? '').trim();
    if (!barcode) return errorResponse('Invalid barcode', 400);
    const db = await getDb();
    await db.unknown_barcode_scans.update({
      where: { barcode },
      data: { resolved_at: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/admin/barcodes/unknown error:', e);
    return errorResponse('Error', 500);
  }
}
