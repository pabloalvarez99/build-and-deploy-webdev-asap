import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser, errorResponse } from '@/lib/firebase/api-helpers';

// Log scan-fails. Cualquier user autenticado puede reportar (cashier scanea en POS).
// Idempotente via UPSERT: increments scan_count + actualiza last_scanned_at.
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json().catch(() => ({}));
    const barcode = String(body.barcode ?? '').trim();
    if (!barcode || barcode.length > 100) return errorResponse('Invalid barcode', 400);

    const db = await getDb();
    await db.$executeRaw`
      INSERT INTO unknown_barcode_scans (barcode, last_user_id)
      VALUES (${barcode}, ${user.uid})
      ON CONFLICT (barcode) DO UPDATE
      SET scan_count = unknown_barcode_scans.scan_count + 1,
          last_scanned_at = NOW(),
          last_user_id = EXCLUDED.last_user_id
      WHERE unknown_barcode_scans.resolved_at IS NULL
    `;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/barcodes/unknown error:', e);
    return errorResponse('Error logging scan', 500);
  }
}
