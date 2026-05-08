import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, ctx: { params: { token: string } }) {
  const { token } = ctx.params
  if (!token || !/^[a-f0-9]{32,64}$/i.test(token)) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
  }

  const db = await getDb()
  const order = await db.orders.findUnique({
    where: { tracking_token: token },
    select: {
      id: true,
      status: true,
      total: true,
      payment_provider: true,
      pickup_code: true,
      reservation_expires_at: true,
      created_at: true,
      updated_at: true,
      guest_name: true,
      order_items: {
        select: { product_name: true, quantity: true, price_at_purchase: true },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  return NextResponse.json({
    id: order.id,
    status: order.status,
    total: order.total.toString(),
    payment_provider: order.payment_provider,
    pickup_code: order.pickup_code,
    reservation_expires_at: order.reservation_expires_at?.toISOString() ?? null,
    created_at: order.created_at.toISOString(),
    updated_at: order.updated_at.toISOString(),
    customer_name: order.guest_name,
    items: order.order_items.map((i) => ({
      product_name: i.product_name,
      quantity: i.quantity,
      price_at_purchase: i.price_at_purchase.toString(),
    })),
  })
}
