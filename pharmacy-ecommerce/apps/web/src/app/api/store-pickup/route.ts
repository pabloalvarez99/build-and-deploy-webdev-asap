import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'
import { sendPickupReservationEmail } from '@/lib/email'
import { POINTS_TO_CLP } from '@/lib/loyalty'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, name, surname, email, phone, notes, session_id, use_points } = body

    if (!items || items.length === 0) return errorResponse('Cart is empty', 400)
    if (!phone) return errorResponse('Phone is required', 400)

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

    // Apply loyalty points discount (only for authenticated users)
    let pointsRedeemed = 0
    let finalTotal = total
    if (use_points && userId) {
      const profile = await db.profiles.findUnique({
        where: { id: userId },
        select: { loyalty_points: true },
      })
      if (profile && profile.loyalty_points > 0) {
        const maxDiscount = profile.loyalty_points * POINTS_TO_CLP
        const discount = Math.min(maxDiscount, total)
        pointsRedeemed = Math.ceil(discount / POINTS_TO_CLP)
        finalTotal = Math.max(0, total - discount)
      }
    }

    const pickupCode = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Create order + items + points redemption atomically
    const order = await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
      const o = await tx.orders.create({
        data: {
          user_id: userId,
          status: 'reserved',
          total: finalTotal,
          notes,
          guest_email: email,
          guest_session_id: session_id,
          payment_provider: 'store',
          pickup_code: pickupCode,
          reservation_expires_at: expiresAt,
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

      // Deduct loyalty points inside the same transaction
      if (pointsRedeemed > 0 && userId) {
        await tx.profiles.update({
          where: { id: userId },
          data: { loyalty_points: { decrement: pointsRedeemed } },
        })
        await tx.loyalty_transactions.create({
          data: { user_id: userId, order_id: o.id, points: -pointsRedeemed, reason: 'redemption' },
        })
      }

      return o
    })

    // Send reservation email (non-blocking, solo si hay email)
    if (email) {
      sendPickupReservationEmail({
        to: email,
        name: name || 'Cliente',
        orderId: order.id,
        pickupCode,
        total: finalTotal,
        expiresAt: expiresAt.toISOString(),
        items: orderItems.map((i) => ({
          product_name: i.product_name,
          quantity: i.quantity,
          price_at_purchase: String(i.price),
        })),
      }).catch(() => {})
    }

    return NextResponse.json({
      order_id: order.id,
      pickup_code: pickupCode,
      expires_at: expiresAt.toISOString(),
      total: finalTotal.toString(),
      points_redeemed: pointsRedeemed,
    })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}
