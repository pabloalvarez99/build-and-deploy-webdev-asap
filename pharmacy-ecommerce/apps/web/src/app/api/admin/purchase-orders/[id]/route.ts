import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

function serializeItem(item: Record<string, unknown>) {
  return {
    ...item,
    unit_cost: String(item.unit_cost),
    subtotal: String(item.subtotal),
    created_at: item.created_at instanceof Date ? item.created_at.toISOString() : item.created_at,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const db = await getDb();

    const order = await db.purchase_orders.findUnique({
      where: { id },
      include: {
        suppliers: true,
        items: {
          include: {
            products: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!order) return errorResponse('Order not found', 404);

    return NextResponse.json({
      ...order,
      total_cost: order.total_cost?.toString() ?? null,
      invoice_date: order.invoice_date?.toISOString() ?? null,
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString(),
      suppliers: {
        ...order.suppliers,
        created_at: order.suppliers.created_at.toISOString(),
        updated_at: order.suppliers.updated_at.toISOString(),
      },
      items: order.items.map((item) =>
        serializeItem(item as unknown as Record<string, unknown>)
      ),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const body = await request.json();
    const db = await getDb();

    const updateData: Record<string, unknown> = {};
    if (body.invoice_number !== undefined) updateData.invoice_number = body.invoice_number?.trim() || null;
    if (body.invoice_date !== undefined) updateData.invoice_date = body.invoice_date ? new Date(body.invoice_date) : null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.status !== undefined) updateData.status = body.status;

    const order = await db.purchase_orders.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...order,
      total_cost: order.total_cost?.toString() ?? null,
      invoice_date: order.invoice_date?.toISOString() ?? null,
      created_at: order.created_at.toISOString(),
      updated_at: order.updated_at.toISOString(),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
