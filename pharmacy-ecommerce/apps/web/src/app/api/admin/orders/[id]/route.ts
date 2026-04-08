import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'

const VALID_STATUSES = ['pending', 'reserved', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']
const STOCK_DEDUCTED_STATUSES = ['paid', 'processing', 'shipped', 'delivered']

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getAdminUser()
    if (!admin) return errorResponse('Unauthorized', 403)

    const { id } = params
    const body = await request.json()
    const db = await getDb()

    if (body.action === 'approve_reservation') return approveReservation(db, id)
    if (body.action === 'reject_reservation') return rejectReservation(db, id)

    if (!VALID_STATUSES.includes(body.status)) {
      return errorResponse(`Estado inválido. Debe ser uno de: ${VALID_STATUSES.join(', ')}`, 400)
    }

    // When cancelling, restore stock if it was already deducted
    if (body.status === 'cancelled') {
      const current = await db.orders.findUnique({ where: { id }, select: { status: true } })
      if (current && STOCK_DEDUCTED_STATUSES.includes(current.status)) {
        const items = await db.order_items.findMany({
          where: { order_id: id },
          select: { product_id: true, quantity: true },
        })
        await db.$transaction(async (tx) => {
          for (const item of items) {
            if (item.product_id) {
              await tx.products.update({
                where: { id: item.product_id },
                data: { stock: { increment: item.quantity } },
              })
            }
          }
        })
      }
    }

    const updated = await db.orders.update({ where: { id }, data: { status: body.status } })
    return NextResponse.json({ ...updated, total: updated.total.toString() })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}

async function approveReservation(db: Awaited<ReturnType<typeof getDb>>, orderId: string) {
  const order = await db.orders.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, total: true, guest_email: true, guest_name: true, guest_surname: true, pickup_code: true },
  })
  if (!order) return errorResponse('Order not found', 404)
  if (order.status !== 'reserved') return errorResponse('Only reserved orders can be approved', 400)

  const items = await db.order_items.findMany({
    where: { order_id: orderId },
    select: { product_id: true, product_name: true, quantity: true, price_at_purchase: true },
  })

  // Decrement stock atomically for each item
  for (const item of items) {
    if (!item.product_id) continue
    try {
      await db.$transaction(async (tx) => {
        const product = await tx.products.findUnique({
          where: { id: item.product_id! },
          select: { stock: true, name: true },
        })
        if (!product || product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product?.name || item.product_name}`)
        }
        await tx.products.update({
          where: { id: item.product_id! },
          data: { stock: { decrement: item.quantity } },
        })
      })
    } catch (err) {
      return errorResponse(err instanceof Error ? err.message : 'Stock insuficiente', 400)
    }
  }

  const updated = await db.orders.update({ where: { id: orderId }, data: { status: 'processing' } })

  // Send approval email (non-blocking)
  if (order.guest_email && order.pickup_code) {
    const { sendPickupApprovalEmail } = await import('@/lib/email')
    sendPickupApprovalEmail({
      to: order.guest_email,
      name: order.guest_name || 'Cliente',
      orderId: order.id,
      pickupCode: order.pickup_code,
      total: Number(order.total),
      items: items.map((i) => ({
        product_name: i.product_name,
        quantity: i.quantity,
        price_at_purchase: i.price_at_purchase.toString(),
      })),
    }).catch(() => {})
  }

  // Low-stock alert (non-blocking)
  const productIds = items.map((i) => i.product_id).filter(Boolean) as string[]
  checkAndAlertLowStock(db, productIds).catch(() => {})

  return NextResponse.json({ ...updated, total: updated.total.toString() })
}

async function rejectReservation(db: Awaited<ReturnType<typeof getDb>>, orderId: string) {
  const order = await db.orders.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, guest_email: true, guest_name: true },
  })
  if (!order) return errorResponse('Order not found', 404)
  if (order.status !== 'reserved') return errorResponse('Only reserved orders can be rejected', 400)

  const updated = await db.orders.update({ where: { id: orderId }, data: { status: 'cancelled' } })

  if (order.guest_email) {
    const { sendPickupRejectionEmail } = await import('@/lib/email')
    sendPickupRejectionEmail({
      to: order.guest_email,
      name: order.guest_name || 'Cliente',
      orderId: order.id,
    }).catch(() => {})
  }

  return NextResponse.json({ ...updated, total: updated.total.toString() })
}

async function checkAndAlertLowStock(db: Awaited<ReturnType<typeof getDb>>, productIds: string[]) {
  if (productIds.length === 0) return
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
    const { sendLowStockAlert } = await import('@/lib/email')
    await sendLowStockAlert(alertEmail, lowStock, threshold)
  }
}
