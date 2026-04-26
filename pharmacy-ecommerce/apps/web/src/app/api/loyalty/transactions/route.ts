import { NextResponse } from 'next/server'
import { getAuthenticatedUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'
import { POINTS_TO_CLP } from '@/lib/loyalty-utils'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return errorResponse('Unauthorized', 401)

    const db = await getDb()

    const [profile, transactions] = await Promise.all([
      db.profiles.findUnique({
        where: { id: user.uid },
        select: { loyalty_points: true },
      }),
      db.loyalty_transactions.findMany({
        where: { user_id: user.uid },
        orderBy: { created_at: 'desc' },
        take: 20,
        select: { id: true, points: true, reason: true, order_id: true, created_at: true },
      }),
    ])

    const total_points = profile?.loyalty_points ?? 0

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        ...t,
        created_at: t.created_at.toISOString(),
      })),
      total_points,
      points_value: total_points * POINTS_TO_CLP,
    })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}
