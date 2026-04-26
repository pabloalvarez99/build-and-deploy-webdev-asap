import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tipo = searchParams.get('tipo');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const db = await getDb();

    const where: Record<string, unknown> = {};
    if (tipo) where.tipo = tipo;
    if (from || to) {
      where.created_at = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + 'T23:59:59') } : {}),
      };
    }

    const [devoluciones, total] = await Promise.all([
      db.devoluciones.findMany({
        where,
        include: {
          orders: { select: { id: true, guest_name: true, guest_email: true, payment_provider: true } },
          items: true,
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.devoluciones.count({ where }),
    ]);

    return NextResponse.json({
      devoluciones: devoluciones.map(d => ({
        ...d,
        total_devuelto: Number(d.total_devuelto),
        items: d.items.map(i => ({ ...i, unit_price: Number(i.unit_price) })),
      })),
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('GET devoluciones error:', error);
    return errorResponse('Internal error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();
    const { order_id, tipo = 'venta', motivo, notas, metodo_reembolso, items } = body;

    if (!motivo) return errorResponse('motivo requerido', 400);
    if (!items || !Array.isArray(items) || items.length === 0) return errorResponse('items requeridos', 400);

    for (const item of items) {
      if (!item.product_name) return errorResponse('product_name requerido en cada item', 400);
      if (!item.quantity || item.quantity <= 0) return errorResponse('quantity debe ser > 0', 400);
      if (item.unit_price == null || item.unit_price < 0) return errorResponse('unit_price inválido', 400);
    }

    const total_devuelto = items.reduce(
      (sum: number, i: { quantity: number; unit_price: number }) => sum + i.quantity * i.unit_price,
      0
    );

    const db = await getDb();

    const devolucion = await db.$transaction(async (tx) => {
      const dev = await tx.devoluciones.create({
        data: {
          order_id: order_id || null,
          tipo,
          motivo,
          notas: notas || null,
          total_devuelto,
          metodo_reembolso: metodo_reembolso || null,
          procesado_por: admin.email || admin.uid,
          items: {
            create: items.map((i: {
              product_id?: string;
              product_name: string;
              quantity: number;
              unit_price: number;
              restock?: boolean;
            }) => ({
              product_id: i.product_id || null,
              product_name: i.product_name,
              quantity: i.quantity,
              unit_price: i.unit_price,
              restock: i.restock !== false,
            })),
          },
        },
        include: { items: true },
      });

      // Restaurar stock y registrar movimiento por cada item con restock=true
      for (const item of dev.items) {
        if (item.restock && item.product_id) {
          await tx.products.update({
            where: { id: item.product_id },
            data: { stock: { increment: item.quantity } },
          });
          await tx.stock_movements.create({
            data: {
              product_id: item.product_id,
              delta: item.quantity,
              reason: 'return',
              admin_id: `${admin.email || admin.uid} — dev:${dev.id.slice(0, 8)}`,
            },
          });
        }
      }

      return dev;
    });

    return NextResponse.json({
      ...devolucion,
      total_devuelto: Number(devolucion.total_devuelto),
      items: devolucion.items.map(i => ({ ...i, unit_price: Number(i.unit_price) })),
    }, { status: 201 });
  } catch (error) {
    console.error('POST devoluciones error:', error);
    return errorResponse('Internal error', 500);
  }
}
