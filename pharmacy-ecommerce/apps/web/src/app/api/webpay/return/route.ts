import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { webpayTransaction } from '@/lib/transbank'
import { sendWebpayConfirmation, sendLowStockAlert } from '@/lib/email'

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
      select: { id: true, total: true, guest_email: true, guest_name: true, guest_surname: true },
    })

    const order = pendingOrders.find((o) =>
      o.id.replace(/-/g, '').startsWith(buyOrderPrefix)
    )

    if (!order) {
      return NextResponse.redirect(`${BASE_URL}/checkout/webpay/error?reason=order_not_found`, { status: 303 })
    }

    // Atomic compare-and-swap: update only if still 'pending' (prevents double-commit)
    const { count } = await db.orders.updateMany({
      where: { id: order.id, status: 'pending' },
      data: { status: 'paid' },
    })

    const fullName = [order.guest_name, order.guest_surname].filter(Boolean).join(' ')

    // Another request already committed — redirect to success anyway
    if (count === 0) {
      return NextResponse.redirect(
        `${BASE_URL}/checkout/webpay/success?order_id=${order.id}&total=${order.total}&name=${encodeURIComponent(fullName)}&token=${tokenWs}`,
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

    // Send confirmation email (non-blocking)
    if (order.guest_email) {
      sendWebpayConfirmation({
        to: order.guest_email,
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

    // Low-stock alert (non-blocking)
    const productIds = orderItems.map((i) => i.product_id).filter(Boolean) as string[]
    if (productIds.length > 0) {
      checkLowStock(db, productIds).catch(() => {})
    }

    return NextResponse.redirect(
      `${BASE_URL}/checkout/webpay/success?order_id=${order.id}&total=${order.total}&name=${encodeURIComponent(fullName)}&token=${tokenWs}`,
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
