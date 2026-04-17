import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return errorResponse('Unauthorized', 403)

    const code = request.nextUrl.searchParams.get('code')?.trim()
    if (!code || !/^\d{6}$/.test(code)) return errorResponse('Código inválido', 400)

    const db = await getDb()
    const order = await db.orders.findFirst({
      where: { pickup_code: code },
      include: { order_items: { select: { product_name: true, quantity: true, price_at_purchase: true } } },
    })

    if (!order) return errorResponse('Reserva no encontrada', 404)

    return NextResponse.json({
      id: order.id,
      status: order.status,
      total: order.total.toString(),
      pickup_code: order.pickup_code,
      reservation_expires_at: order.reservation_expires_at?.toISOString() ?? null,
      created_at: order.created_at.toISOString(),
      guest_name: order.guest_name,
      guest_surname: order.guest_surname,
      guest_email: order.guest_email,
      customer_phone: order.customer_phone,
      items: order.order_items.map(i => ({
        product_name: i.product_name,
        quantity: i.quantity,
        price_at_purchase: i.price_at_purchase.toString(),
      })),
    })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}
