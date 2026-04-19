import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { webpayTransaction } from '@/lib/transbank'
import { sendWebpayConfirmation, sendLowStockAlert, sendNewOrderAlert } from '@/lib/email'
import { awardLoyaltyPoints } from '@/lib/loyalty'
import { adminAuth } from '@/lib/firebase/admin'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  return handleReturn(searchParams.get('token_ws'), searchParams.get('TBK_TOKEN'))
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    return handleReturn(
      formData.get('token_ws') as string | null,
      formData.get('TBK_TOKEN') as string | null
    )
  } catch {
    return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=internal`, { status: 303 })
  }
}

async function handleReturn(tokenWs: string | null, tbkToken: string | null) {
  try {
    // User cancelled — Transbank sends TBK_TOKEN without token_ws
    if (tbkToken && !tokenWs) {
      return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=cancelled&token=${tbkToken}`, { status: 303 })
    }
    // Form error (both tokens) — do NOT commit
    if (tbkToken && tokenWs) {
      return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=cancelled&token=${tbkToken}`, { status: 303 })
    }
    if (!tokenWs) {
      return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=no_token`, { status: 303 })
    }

    // Commit with Transbank
    const result = await webpayTransaction.commit(tokenWs)
    if (result.response_code !== 0) {
      return NextResponse.redirect(
        `${BASE_URL}/checkout/webpay/error?reason=rejected&code=${result.response_code}&token=${tokenWs}`,
        { status: 303 }
      )
    }

    const db = await getDb()
    const buyOrderPrefix = result.buy_order as string

    // Find pending webpay order matching the buy_order prefix
    const pendingOrders = await db.orders.findMany({
      where: { payment_provider: 'webpay', status: 'pending' },
      select: { id: true, total: true, user_id: true, guest_email: true, guest_name: true, guest_surname: true, payment_provider: true },
    })

    const order = pendingOrders.find((o) =>
      o.id.replace(/-/g, '').startsWith(buyOrderPrefix)
    )

    if (!order) {
      return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=order_not_found`, { status: 303 })
    }

    // Generar pickup_code para retiro en tienda
    const pickupCode = String(Math.floor(100000 + Math.random() * 900000))
    const pickupExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Atomic compare-and-swap: update only if still 'pending' (prevents double-commit)
    const { count } = await db.orders.updateMany({
      where: { id: order.id, status: 'pending' },
      data: { status: 'paid', pickup_code: pickupCode, reservation_expires_at: pickupExpires },
    })

    const fullName = [order.guest_name, order.guest_surname].filter(Boolean).join(' ')

    // Another request already committed — redirect to success anyway
    if (count === 0) {
      const existing = await db.orders.findUnique({ where: { id: order.id }, select: { pickup_code: true, reservation_expires_at: true, total: true } })
      return NextResponse.redirect(
        `${BASE_URL}/checkout/reservation?order_id=${order.id}&code=${existing?.pickup_code ?? pickupCode}&expires=${encodeURIComponent((existing?.reservation_expires_at ?? pickupExpires).toISOString())}&total=${existing?.total ?? order.total}`,
        { status: 303 }
      )
    }

    // Fetch items and decrement stock (each item in its own transaction for atomicity)
    const orderItems = await db.order_items.findMany({
      where: { order_id: order.id },
      select: { product_id: true, product_name: true, quantity: true, price_at_purchase: true },
    })

    for (const item of orderItems) {
      if (!item.product_id) continue
      await db.$transaction(async (tx: Parameters<Parameters<typeof db.$transaction>[0]>[0]) => {
        const product = await tx.products.findUnique({
          where: { id: item.product_id! },
          select: { stock: true },
        })
        if (product && product.stock >= item.quantity) {
          await tx.products.update({
            where: { id: item.product_id! },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }).catch(console.error)
    }

    // Send confirmation email (non-blocking) — guest o usuario registrado
    const emailDest = order.guest_email || await (async () => {
      if (!order.user_id) return null
      try { return (await adminAuth.getUser(order.user_id)).email ?? null } catch { return null }
    })()
    if (emailDest) {
      sendWebpayConfirmation({
        to: emailDest,
        name: order.guest_name || 'Cliente',
        orderId: order.id,
        total: Number(order.total),
        items: orderItems.map((i) => ({
          product_name: i.product_name,
          quantity: i.quantity,
          price_at_purchase: i.price_at_purchase.toString(),
        })),
      }).catch(() => {})
    }

    // Loyalty points (non-blocking — solo para usuarios registrados)
    if (order.user_id) {
      awardLoyaltyPoints(order.user_id, order.id, Number(order.total)).catch(() => {})
    }

    // Low-stock alert (non-blocking)
    const productIds = orderItems.map((i) => i.product_id).filter(Boolean) as string[]
    if (productIds.length > 0) {
      checkLowStock(db, productIds).catch(() => {})
    }

    // New order alert to admin (non-blocking)
    notifyAdminNewOrder(db, order, orderItems).catch(() => {})

    return NextResponse.redirect(
      `${BASE_URL}/checkout/reservation?order_id=${order.id}&code=${pickupCode}&expires=${encodeURIComponent(pickupExpires.toISOString())}&total=${order.total}&paid=webpay`,
      { status: 303 }
    )
  } catch (error) {
    console.error('Webpay return error:', error)
    return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=internal`, { status: 303 })
  }
}

async function checkLowStock(db: Awaited<ReturnType<typeof getDb>>, productIds: string[]) {
  const settings = await db.admin_settings.findMany({ select: { key: true, value: true } })
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  const threshold = parseInt(map.low_stock_threshold || '10')
  const alertEmail = map.alert_email
  if (!alertEmail) return
  const lowStock = await db.products.findMany({
    where: { id: { in: productIds }, stock: { lte: threshold } },
    select: { name: true, stock: true },
  })
  if (lowStock.length > 0) {
    await sendLowStockAlert(alertEmail, lowStock, threshold)
  }
}

async function notifyAdminNewOrder(
  db: Awaited<ReturnType<typeof getDb>>,
  order: { id: string; total: unknown; guest_name: string | null; guest_surname: string | null; user_id: string | null; payment_provider: string | null },
  items: { product_name: string; quantity: number; price_at_purchase: { toString(): string } }[]
) {
  const settings = await db.admin_settings.findMany({ select: { key: true, value: true } })
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
  const alertEmail = map.alert_email
  if (!alertEmail) return

  const customerName = order.guest_name
    ? `${order.guest_name} ${order.guest_surname ?? ''}`.trim()
    : 'Cliente registrado'

  await sendNewOrderAlert({
    toEmail: alertEmail,
    orderId: order.id,
    customerName,
    total: Number(order.total),
    paymentMethod: order.payment_provider === 'store' ? 'Retiro en tienda' : 'Webpay',
    items: items.map(i => ({
      product_name: i.product_name,
      quantity: i.quantity,
      price: parseFloat(i.price_at_purchase.toString()),
    })),
  })
}
