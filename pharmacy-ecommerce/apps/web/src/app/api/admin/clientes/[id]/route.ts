import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers'
import { adminAuth } from '@/lib/firebase/admin'
import { getDb } from '@/lib/db'

// GET /api/admin/clientes/[id] — customer detail + full order history
// For registered: id = Firebase uid
// For guest: id = 'guest', ?email=xxx
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser()
  if (!admin) return errorResponse('Unauthorized', 401)

  const db = await getDb()
  const { id } = params

  type OrderRow = {
    id: string
    status: string
    total: unknown
    created_at: Date
    payment_provider: string | null
    pickup_code: string | null
    notes: string | null
    shipping_address: string | null
    guest_name: string | null
    guest_surname: string | null
    guest_email: string | null
    customer_phone: string | null
    user_id: string | null
    order_items: Array<{ id: string; product_id: string | null; product_name: string; quantity: number; price_at_purchase: unknown }>
  }

  function computeKpis(orders: OrderRow[]) {
    const valid = orders.filter((o) => !['cancelled', 'pending'].includes(o.status))
    const lifetime_spend = valid.reduce((s, o) => s + Number(o.total), 0)
    const order_count = valid.length
    const avg_ticket = order_count > 0 ? lifetime_spend / order_count : 0
    const dates = valid.map((o) => o.created_at).sort((a, b) => a.getTime() - b.getTime())
    const first_order = dates[0] ?? null
    const last_order = dates[dates.length - 1] ?? null
    let frequency_days: number | null = null
    let next_predicted: string | null = null
    if (first_order && last_order && order_count >= 2) {
      const span = (last_order.getTime() - first_order.getTime()) / (1000 * 60 * 60 * 24)
      frequency_days = Math.max(1, Math.round(span / (order_count - 1)))
      next_predicted = new Date(last_order.getTime() + frequency_days * 24 * 60 * 60 * 1000).toISOString()
    }
    // Top recurrent products
    const productCount: Record<string, { product_id: string | null; product_name: string; orders: number; total_qty: number }> = {}
    for (const o of valid) {
      const seen = new Set<string>()
      for (const it of o.order_items) {
        const key = it.product_id ?? `name:${it.product_name}`
        if (!productCount[key]) productCount[key] = { product_id: it.product_id, product_name: it.product_name, orders: 0, total_qty: 0 }
        productCount[key].total_qty += it.quantity
        if (!seen.has(key)) {
          productCount[key].orders += 1
          seen.add(key)
        }
      }
    }
    const top_recurrent = Object.values(productCount)
      .filter((p) => p.orders >= 2)
      .sort((a, b) => b.orders - a.orders || b.total_qty - a.total_qty)
      .slice(0, 10)
    return {
      lifetime_spend,
      order_count,
      avg_ticket,
      first_order: first_order?.toISOString() ?? null,
      last_order: last_order?.toISOString() ?? null,
      frequency_days,
      next_predicted,
      top_recurrent,
    }
  }

  if (id === 'guest') {
    const email = request.nextUrl.searchParams.get('email')
    if (!email) return errorResponse('email required for guest lookup', 400)

    const orders = await db.orders.findMany({
      where: { guest_email: { equals: email, mode: 'insensitive' } },
      include: { order_items: true },
      orderBy: { created_at: 'desc' },
    })

    const first = orders[0]
    const kpis = computeKpis(orders as unknown as OrderRow[])
    const phone = first?.customer_phone || null
    const prescriptions = phone
      ? await db.prescription_records.findMany({
          where: { orders: { customer_phone: phone } },
          orderBy: { dispensed_at: 'desc' },
          take: 50,
        })
      : []
    return NextResponse.json({
      customer: {
        id: null,
        email,
        name: first?.guest_name || '',
        surname: first?.guest_surname || '',
        phone,
        type: 'guest',
        created_at: first?.created_at || null,
      },
      kpis,
      orders: orders.map((o: typeof orders[number]) => ({ ...o, items: o.order_items || [] })),
      prescriptions,
      loyalty_transactions: [],
    })
  }

  // Registered user
  let fbUser
  try {
    fbUser = await adminAuth.getUser(id)
  } catch {
    return errorResponse('Cliente no encontrado', 404)
  }

  const [orders, profile, loyaltyTxs] = await Promise.all([
    db.orders.findMany({
      where: { user_id: id },
      include: { order_items: true },
      orderBy: { created_at: 'desc' },
    }),
    db.profiles.findUnique({ where: { id }, select: { loyalty_points: true, phone: true, rut: true, name: true, created_at: true } }),
    db.loyalty_transactions.findMany({
      where: { user_id: id },
      orderBy: { created_at: 'desc' },
      take: 100,
    }),
  ])

  const prescriptions = profile?.rut
    ? await db.prescription_records.findMany({
        where: { patient_rut: profile.rut },
        orderBy: { dispensed_at: 'desc' },
        take: 50,
      })
    : []

  const kpis = computeKpis(orders as unknown as OrderRow[])

  return NextResponse.json({
    customer: {
      id: fbUser.uid,
      email: fbUser.email,
      name: fbUser.displayName || profile?.name || '',
      surname: '',
      phone: fbUser.phoneNumber || profile?.phone || null,
      rut: profile?.rut || null,
      type: 'registered',
      created_at: fbUser.metadata.creationTime,
      loyalty_points: profile?.loyalty_points ?? 0,
    },
    kpis,
    orders: orders.map((o: typeof orders[number]) => ({ ...o, items: o.order_items || [] })),
    prescriptions,
    loyalty_transactions: loyaltyTxs,
  })
}

// PUT /api/admin/clientes/[id] — update registered user data
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser()
  if (!admin) return errorResponse('Unauthorized', 401)

  const { id } = params
  const { name, surname, email } = await request.json()

  try {
    const updated = await adminAuth.updateUser(id, {
      ...(email ? { email } : {}),
      ...(name ? { displayName: [name, surname].filter(Boolean).join(' ').trim() } : {}),
    })
    return NextResponse.json({ success: true, user: { uid: updated.uid, email: updated.email } })
  } catch (err: unknown) {
    const msg = (err as Error).message || 'Error al actualizar cliente'
    return errorResponse(msg, 500)
  }
}

// DELETE /api/admin/clientes/[id] — delete user account (orders remain)
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const admin = await getAdminUser()
  if (!admin) return errorResponse('Unauthorized', 401)

  try {
    await adminAuth.deleteUser(params.id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = (err as Error).message || 'Error al eliminar cliente'
    return errorResponse(msg, 500)
  }
}
