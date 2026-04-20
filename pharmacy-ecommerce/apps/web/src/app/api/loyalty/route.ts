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

    return NextResponse.json({
      points: profile?.loyalty_points ?? 0,
      points_value: (profile?.loyalty_points ?? 0) * POINTS_TO_CLP,
      transactions: transactions.map((t) => ({
        ...t,
        created_at: t.created_at.toISOString(),
      })),
    })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}
