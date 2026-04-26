import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();

    const devolucion = await db.devoluciones.findUnique({
      where: { id: params.id },
      include: {
        orders: {
          select: {
            id: true,
            guest_name: true,
            guest_email: true,
            payment_provider: true,
            total: true,
          },
        },
        items: true,
      },
    });

    if (!devolucion) return errorResponse('No encontrada', 404);

    return NextResponse.json({
      ...devolucion,
      total_devuelto: Number(devolucion.total_devuelto),
      orders: devolucion.orders
        ? { ...devolucion.orders, total: Number(devolucion.orders.total) }
        : null,
      items: devolucion.items.map(i => ({ ...i, unit_price: Number(i.unit_price) })),
    });
  } catch (error) {
    console.error('GET devolucion error:', error);
    return errorResponse('Internal error', 500);
  }
}
