import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'
import { webpayTransaction } from '@/lib/transbank'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, name, surname, email, phone, notes, session_id } = body

    if (!items || items.length === 0) return errorResponse('Cart is empty', 400)
    if (!email || !phone) return errorResponse('Email and phone are required', 400)

    const [db, authenticatedUser] = await Promise.all([getDb(), getAuthenticatedUser()])
    const userId = authenticatedUser?.uid ?? null

    // Validate products and calculate total
    let total = 0
    const orderItems: { product_id: string; product_name: string; quantity: number; price: number }[] = []

    for (const item of items) {
      const product = await db.products.findFirst({
        where: { id: item.product_id, active: true },
        select: { id: true, name: true, price: true, stock: true, discount_percent: true },
      })

      if (!product) return errorResponse(`Product ${item.product_id} not found`, 404)
      if (product.stock < item.quantity) return errorResponse(`Stock insuficiente para ${product.name}`, 400)

      const rawPrice = Number(product.price)
      const disc = product.discount_percent
      const price = disc ? Math.ceil(rawPrice * (1 - disc / 100)) : rawPrice
      total += price * item.quantity
      orderItems.push({ product_id: product.id, product_name: product.name, quantity: item.quantity, price })
    }

    // Create order + items atomically
    const order = await db.$transaction(async (tx) => {
      const o = await tx.orders.create({
        data: {
          user_id: userId,
          status: 'pending',
          total,
          notes,
          guest_email: email,
          guest_session_id: session_id,
          payment_provider: 'webpay',
          customer_phone: phone,
          guest_name: name,
          guest_surname: surname,
        },
        select: { id: true },
      })

      await tx.order_items.createMany({
        data: orderItems.map((item) => ({
          order_id: o.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          price_at_purchase: item.price,
        })),
      })

      return o
    })

    // buyOrder max 26 chars — UUID without dashes, truncated
    const buyOrder = order.id.replace(/-/g, '').substring(0, 26)
    const returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webpay/return`

    const tbkResponse = await webpayTransaction.create(
      buyOrder,
      session_id || order.id,
      Math.round(total),
      returnUrl
    )

    return NextResponse.json({ url: tbkResponse.url, token: tbkResponse.token, order_id: order.id })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}
