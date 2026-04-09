import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

function serializePO(po: Record<string, unknown>) {
  return {
    ...po,
    total_cost: po.total_cost != null ? String(po.total_cost) : null,
    invoice_date: po.invoice_date instanceof Date ? po.invoice_date.toISOString() : po.invoice_date,
    created_at: po.created_at instanceof Date ? po.created_at.toISOString() : po.created_at,
    updated_at: po.updated_at instanceof Date ? po.updated_at.toISOString() : po.updated_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const sp = request.nextUrl.searchParams;
    const page = parseInt(sp.get('page') || '1');
    const limit = parseInt(sp.get('limit') || '20');
    const status = sp.get('status') || undefined;
    const supplier_id = sp.get('supplier_id') || undefined;
    const offset = (page - 1) * limit;

    const where = {
      ...(status ? { status } : {}),
      ...(supplier_id ? { supplier_id } : {}),
    };

    const db = await getDb();
    const [orders, total] = await Promise.all([
      db.purchase_orders.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
        include: {
          suppliers: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      db.purchase_orders.count({ where }),
    ]);

    return NextResponse.json({
      orders: orders.map((o) => serializePO(o as unknown as Record<string, unknown>)),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();

    if (!body.supplier_id) return errorResponse('supplier_id is required', 400);
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse('items array is required', 400);
    }

    const db = await getDb();

    // Calcular total_cost desde los items
    const total_cost = body.items.reduce(
      (sum: number, item: { subtotal: number }) => sum + (item.subtotal || 0),
      0
    );

    const order = await db.purchase_orders.create({
      data: {
        supplier_id: body.supplier_id,
        invoice_number: body.invoice_number?.trim() || null,
        invoice_date: body.invoice_date ? new Date(body.invoice_date) : null,
        status: 'draft',
        total_cost,
        notes: body.notes?.trim() || null,
        ocr_raw: body.ocr_raw || null,
        created_by: admin.email || admin.uid,
        items: {
          create: body.items.map((item: {
            product_id?: string;
            supplier_product_code?: string;
            product_name_invoice?: string;
            quantity: number;
            unit_cost: number;
            subtotal: number;
          }) => ({
            product_id: item.product_id || null,
            supplier_product_code: item.supplier_product_code || null,
            product_name_invoice: item.product_name_invoice || null,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            subtotal: item.subtotal,
          })),
        },
      },
      include: {
        suppliers: { select: { id: true, name: true } },
        items: true,
      },
    });

    return NextResponse.json(serializePO(order as unknown as Record<string, unknown>));
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
