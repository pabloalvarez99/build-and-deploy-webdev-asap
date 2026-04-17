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

  if (id === 'guest') {
    const email = request.nextUrl.searchParams.get('email')
    if (!email) return errorResponse('email required for guest lookup', 400)

    const orders = await db.orders.findMany({
      where: { guest_email: { equals: email, mode: 'insensitive' } },
      include: { order_items: true },
      orderBy: { created_at: 'desc' },
    })

    const first = orders[0]
    return NextResponse.json({
      customer: {
        id: null,
        email,
        name: first?.guest_name || '',
        surname: first?.guest_surname || '',
        phone: first?.customer_phone || null,
        type: 'guest',
        created_at: first?.created_at || null,
      },
      orders: orders.map((o: typeof orders[number]) => ({ ...o, items: o.order_items || [] })),
    })
  }

  // Registered user
  let fbUser
  try {
    fbUser = await adminAuth.getUser(id)
  } catch {
    return errorResponse('Cliente no encontrado', 404)
  }

  const [orders, profile] = await Promise.all([
    db.orders.findMany({
      where: { user_id: id },
      include: { order_items: true },
      orderBy: { created_at: 'desc' },
    }),
    db.profiles.findUnique({ where: { id }, select: { loyalty_points: true, phone: true } }),
  ])

  return NextResponse.json({
    customer: {
      id: fbUser.uid,
      email: fbUser.email,
      name: fbUser.displayName || '',
      surname: '',
      phone: fbUser.phoneNumber || profile?.phone || null,
      type: 'registered',
      created_at: fbUser.metadata.creationTime,
      loyalty_points: profile?.loyalty_points ?? 0,
    },
    orders: orders.map((o: typeof orders[number]) => ({ ...o, items: o.order_items || [] })),
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
