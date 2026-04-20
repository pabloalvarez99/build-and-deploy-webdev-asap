import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'

// POST /api/admin/loyalty — manually adjust loyalty points for a user
// Body: { user_id, points, reason }
// points can be positive (add) or negative (deduct)
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return errorResponse('Unauthorized', 403)

    const { user_id, points, reason } = await request.json()

    if (!user_id || typeof user_id !== 'string') return errorResponse('user_id requerido', 400)
    if (!points || typeof points !== 'number' || points === 0) return errorResponse('points debe ser un número distinto de cero', 400)
    if (!reason || typeof reason !== 'string') return errorResponse('reason requerido', 400)

    const db = await getDb()

    // Check profile exists and has enough points if deducting
    const profile = await db.profiles.findUnique({
      where: { id: user_id },
      select: { loyalty_points: true },
    })

    if (!profile) {
      // Create profile if it doesn't exist (first-time point award)
      if (points < 0) return errorResponse('El cliente no tiene puntos acumulados', 400)
    } else if (points < 0 && profile.loyalty_points < Math.abs(points)) {
      return errorResponse(`Puntos insuficientes. El cliente tiene ${profile.loyalty_points} puntos.`, 400)
    }

    const newBalance = await db.$transaction(async (tx) => {
      const updated = await tx.profiles.upsert({
        where: { id: user_id },
        update: { loyalty_points: { increment: points } },
        create: { id: user_id, loyalty_points: Math.max(0, points) },
      })
      await tx.loyalty_transactions.create({
        data: {
          user_id,
          points,
          reason: reason.slice(0, 50),
        },
      })
      return updated.loyalty_points
    })

    return NextResponse.json({ success: true, new_balance: newBalance })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}

// GET /api/admin/loyalty?user_id=xxx — get loyalty transaction history for a user
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser()
    if (!admin) return errorResponse('Unauthorized', 403)

    const user_id = request.nextUrl.searchParams.get('user_id')
    if (!user_id) return errorResponse('user_id requerido', 400)

    const db = await getDb()

    const [profile, transactions] = await Promise.all([
      db.profiles.findUnique({ where: { id: user_id }, select: { loyalty_points: true } }),
      db.loyalty_transactions.findMany({
        where: { user_id },
        orderBy: { created_at: 'desc' },
        take: 50,
        select: { id: true, points: true, reason: true, order_id: true, created_at: true },
      }),
    ])

    return NextResponse.json({
      points: profile?.loyalty_points ?? 0,
      transactions: transactions.map((t) => ({
        ...t,
        created_at: t.created_at.toISOString(),
      })),
    })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}
