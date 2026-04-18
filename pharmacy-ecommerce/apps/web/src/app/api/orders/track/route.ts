import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * GET /api/orders/track?id=xxx&email=xxx
 * OR  /api/orders/track?id=xxx&phone=last4digits
 *
 * Public endpoint to look up an order by ID + email/phone (no auth required).
 * Returns basic status info without sensitive details.
 */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim().toLowerCase()
  const email = request.nextUrl.searchParams.get('email')?.trim().toLowerCase()
  const phone = request.nextUrl.searchParams.get('phone')?.replace(/\D/g, '').slice(-4)

  if (!id || id.length < 6) {
    return NextResponse.json({ error: 'ID de pedido inválido' }, { status: 400 })
  }
  if (!email && (!phone || phone.length < 4)) {
    return NextResponse.json({ error: 'Ingresa tu email o teléfono' }, { status: 400 })
  }

  const db = await getDb()

  // Find order by partial ID — users typically have the first 8 chars of the UUID
  // Use raw query to cast UUID to text for prefix search
  const rows = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM orders WHERE id::text ILIKE ${id + '%'} LIMIT 1
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  const order = await db.orders.findUnique({
    where: { id: rows[0].id },
    include: {
      order_items: {
        select: { product_name: true, quantity: true, price_at_purchase: true },
      },
    },
  })

  if (!order) {
    return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  }

  // Verify identity: email or phone last 4 digits
  const orderEmail = order.guest_email?.toLowerCase() || ''
  const orderPhone = (order.customer_phone || '').replace(/\D/g, '')

  let verified = false
  if (email && orderEmail && orderEmail === email) verified = true
  if (phone && phone.length >= 4 && orderPhone.endsWith(phone)) verified = true

  if (!verified) {
    return NextResponse.json({ error: 'No coincide con los datos del pedido' }, { status: 403 })
  }

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendiente de pago',
    reserved: 'Reservado — pendiente de aprobación',
    paid: 'Pagado — preparando tu pedido',
    processing: 'Aprobado — listo para retiro',
    completed: 'Completado',
    shipped: 'Enviado',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  }

  return NextResponse.json({
    id: order.id,
    short_id: order.id.substring(0, 8).toUpperCase(),
    status: order.status,
    status_label: STATUS_LABELS[order.status] || order.status,
    total: order.total.toString(),
    created_at: order.created_at.toISOString(),
    pickup_code: order.pickup_code,
    payment_provider: order.payment_provider,
    items: order.order_items.map((i) => ({
      product_name: i.product_name,
      quantity: i.quantity,
      subtotal: (Number(i.price_at_purchase) * i.quantity).toString(),
    })),
  })
}
