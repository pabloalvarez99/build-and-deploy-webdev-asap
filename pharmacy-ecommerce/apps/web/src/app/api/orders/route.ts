import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'

// GET /api/orders — list authenticated user's orders
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return errorResponse('No autenticado', 401)

  const { searchParams } = request.nextUrl
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = Math.min(Number(searchParams.get('limit') || 10), 50)
  const offset = (page - 1) * limit
  const status = searchParams.get('status')

  const db = await getDb()
  const where = { user_id: user.uid, ...(status ? { status } : {}) }

  const [orders, total] = await Promise.all([
    db.orders.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limit,
    }),
    db.orders.count({ where }),
  ])

  return NextResponse.json({
    orders: orders.map((o) => ({
      ...o,
      total: o.total.toString(),
      created_at: o.created_at.toISOString(),
      reservation_expires_at: o.reservation_expires_at?.toISOString() ?? null,
    })),
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  })
}
