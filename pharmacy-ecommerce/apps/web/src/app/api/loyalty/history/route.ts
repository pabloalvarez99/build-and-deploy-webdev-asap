import { NextResponse } from 'next/server'
import { getAuthenticatedUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return errorResponse('Unauthorized', 401)

    const db = await getDb()

    const transactions = await db.loyalty_transactions.findMany({
      where: { user_id: user.uid },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: { id: true, points: true, reason: true, order_id: true, created_at: true },
    })

    const serialized = transactions.map((t) => ({
      ...t,
      created_at: t.created_at.toISOString(),
    }))

    const totalEarned = serialized
      .filter((t) => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0)

    const totalRedeemed = Math.abs(
      serialized.filter((t) => t.points < 0).reduce((sum, t) => sum + t.points, 0)
    )

    return NextResponse.json({ transactions: serialized, totalEarned, totalRedeemed })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}
