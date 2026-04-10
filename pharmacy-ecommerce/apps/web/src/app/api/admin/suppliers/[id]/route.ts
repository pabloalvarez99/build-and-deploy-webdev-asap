import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const db = await getDb();

    const supplier = await db.suppliers.findUnique({
      where: { id },
      include: {
        purchase_orders: {
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            invoice_number: true,
            invoice_date: true,
            status: true,
            total_cost: true,
            created_at: true,
          },
        },
        _count: { select: { purchase_orders: true } },
        supplier_product_mappings: {
          select: {
            id: true,
            supplier_code: true,
            products: { select: { name: true, stock: true } },
          },
          orderBy: { supplier_code: 'asc' },
        },
      },
    });

    if (!supplier) return errorResponse('Supplier not found', 404);

    return NextResponse.json({
      ...supplier,
      purchase_orders: supplier.purchase_orders.map((po) => ({
        ...po,
        total_cost: po.total_cost?.toString() ?? null,
        invoice_date: po.invoice_date?.toISOString() ?? null,
        created_at: po.created_at.toISOString(),
      })),
      created_at: supplier.created_at.toISOString(),
      updated_at: supplier.updated_at.toISOString(),
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
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.rut !== undefined) updateData.rut = body.rut?.trim() || null;
    if (body.contact_name !== undefined) updateData.contact_name = body.contact_name?.trim() || null;
    if (body.contact_email !== undefined) updateData.contact_email = body.contact_email?.trim() || null;
    if (body.contact_phone !== undefined) updateData.contact_phone = body.contact_phone?.trim() || null;
    if (body.website !== undefined) updateData.website = body.website?.trim() || null;
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null;
    if (body.active !== undefined) updateData.active = body.active;

    const supplier = await db.suppliers.update({
      where: { id },
      data: updateData,
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

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const db = await getDb();

    // No eliminar si tiene órdenes de compra asociadas
    const orderCount = await db.purchase_orders.count({ where: { supplier_id: id } });
    if (orderCount > 0) {
      return errorResponse(
        `No se puede eliminar: el proveedor tiene ${orderCount} orden(es) de compra`,
        409
      );
    }

    await db.suppliers.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
