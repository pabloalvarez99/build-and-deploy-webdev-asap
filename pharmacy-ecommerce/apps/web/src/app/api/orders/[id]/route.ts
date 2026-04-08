import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'

// GET /api/orders/[id] — get single order (must belong to authenticated user)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser()
  if (!user) return errorResponse('No autenticado', 401)

  const db = await getDb()
  const order = await db.orders.findFirst({
    where: { id: params.id, user_id: user.uid },
    include: { order_items: true },
  })

  if (!order) return errorResponse('Orden no encontrada', 404)

  return NextResponse.json({
    ...order,
    total: order.total.toString(),
    created_at: order.created_at.toISOString(),
    reservation_expires_at: order.reservation_expires_at?.toISOString() ?? null,
    items: order.order_items.map((i) => ({
      ...i,
      price_at_purchase: i.price_at_purchase.toString(),
    })),
  })
}
