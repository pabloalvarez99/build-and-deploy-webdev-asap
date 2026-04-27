import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { sendExpressOrderEmail } from '@/lib/email';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { supplier_id, items, notes } = await request.json();
    // items: [{ name: string; qty: number; unit_cost?: number | null }]

    if (!supplier_id) return errorResponse('supplier_id requerido', 400);
    if (!Array.isArray(items) || items.length === 0) return errorResponse('items requerido', 400);

    const db = await getDb();
    const supplier = await db.suppliers.findUnique({
      where: { id: supplier_id },
      select: { name: true, contact_email: true, contact_name: true },
    });

    if (!supplier) return errorResponse('Proveedor no encontrado', 404);
    if (!supplier.contact_email) return errorResponse('El proveedor no tiene email registrado', 400);

    const settings = await db.admin_settings.findMany({
      where: { key: { in: ['alert_email', 'pharmacy_contact'] } },
      select: { key: true, value: true },
    });
    const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
    const pharmacyContact = settingsMap.alert_email ?? 'Tu Farmacia';

    await sendExpressOrderEmail({
      supplierEmail: supplier.contact_email!,
      supplierName: supplier.contact_name ?? supplier.name,
      pharmacyContact,
      items,
      notes: notes ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('reposicion/express POST error:', e);
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
}
