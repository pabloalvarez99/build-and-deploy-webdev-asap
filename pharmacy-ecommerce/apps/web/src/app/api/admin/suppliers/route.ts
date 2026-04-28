import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const owner = await getOwnerUser();
    if (!owner) return errorResponse('Unauthorized', 403);

    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('include_inactive') === 'true';

    const db = await getDb();

    const suppliers = await db.suppliers.findMany({
      where: includeInactive ? undefined : { active: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { purchase_orders: true },
        },
        purchase_orders: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { created_at: true, status: true },
        },
      },
    });

    const serialized = suppliers.map((s) => ({
      ...s,
      _count: s._count,
      last_order: s.purchase_orders[0]
        ? {
            created_at: s.purchase_orders[0].created_at.toISOString(),
            status: s.purchase_orders[0].status,
          }
        : null,
      purchase_orders: undefined,
      created_at: s.created_at.toISOString(),
      updated_at: s.updated_at.toISOString(),
    }));

    return NextResponse.json({ suppliers: serialized });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const owner = await getOwnerUser();
    if (!owner) return errorResponse('Unauthorized', 403);

    const body = await request.json();

    if (!body.name?.trim()) {
      return errorResponse('name is required', 400);
    }

    const db = await getDb();

    const supplier = await db.suppliers.create({
      data: {
        name: body.name.trim(),
        rut: body.rut?.trim() || null,
        contact_name: body.contact_name?.trim() || null,
        contact_email: body.contact_email?.trim() || null,
        contact_phone: body.contact_phone?.trim() || null,
        website: body.website?.trim() || null,
        notes: body.notes?.trim() || null,
        active: body.active !== false,
      },
    });

    return NextResponse.json({
      ...supplier,
      created_at: supplier.created_at.toISOString(),
      updated_at: supplier.updated_at.toISOString(),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
