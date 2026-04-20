import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const sp = request.nextUrl.searchParams;
    const productId = sp.get('product_id');
    const supplierId = sp.get('supplier_id');

    const db = await getDb();

    const prices = await db.supplier_price_lists.findMany({
      where: {
        ...(productId ? { product_id: productId } : {}),
        ...(supplierId ? { supplier_id: supplierId } : {}),
      },
      include: {
        suppliers: { select: { id: true, name: true } },
        products: { select: { id: true, name: true, price: true, cost_price: true } },
      },
      orderBy: { unit_price: 'asc' },
    });

    const serialized = prices.map(p => ({
      id: p.id,
      supplier_id: p.supplier_id,
      product_id: p.product_id,
      unit_price: Number(p.unit_price),
      valid_from: p.valid_from.toISOString().split('T')[0],
      valid_until: p.valid_until ? p.valid_until.toISOString().split('T')[0] : null,
      notes: p.notes,
      created_at: p.created_at.toISOString(),
      supplier: p.suppliers,
      product: p.products ? {
        ...p.products,
        price: Number(p.products.price),
        cost_price: p.products.cost_price ? Number(p.products.cost_price) : null,
      } : null,
    }));

    return NextResponse.json({ prices: serialized });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();
    const { supplier_id, product_id, unit_price, valid_from, valid_until, notes } = body;

    if (!supplier_id || !product_id || !unit_price) {
      return errorResponse('supplier_id, product_id y unit_price son requeridos', 400);
    }

    const db = await getDb();

    // Upsert: find existing price for same supplier+product, replace it
    const existing = await db.supplier_price_lists.findFirst({
      where: { supplier_id, product_id },
    });

    const data = {
      supplier_id,
      product_id,
      unit_price: Number(unit_price),
      valid_from: valid_from ? new Date(valid_from) : new Date(),
      valid_until: valid_until ? new Date(valid_until) : null,
      notes: notes || null,
    };

    let price;
    if (existing) {
      price = await db.supplier_price_lists.update({ where: { id: existing.id }, data });
    } else {
      price = await db.supplier_price_lists.create({ data });
    }

    return NextResponse.json({
      price: {
        ...price,
        unit_price: Number(price.unit_price),
        valid_from: price.valid_from.toISOString().split('T')[0],
        valid_until: price.valid_until ? price.valid_until.toISOString().split('T')[0] : null,
        created_at: price.created_at.toISOString(),
      },
      updated: !!existing,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
