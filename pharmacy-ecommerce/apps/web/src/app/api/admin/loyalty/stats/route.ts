import { NextResponse } from 'next/server'
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'
import { POINTS_TO_CLP } from '@/lib/loyalty-utils'

export async function GET() {
  try {
    const admin = await getAdminUser()
    if (!admin) return errorResponse('Unauthorized', 403)

    const db = await getDb()

    // KPIs
    const [membersResult, recentTxs, topClients, monthlyRaw] = await Promise.all([
      // Total members with points + total pending points
      db.$queryRaw<{ total_members: bigint; total_points: bigint }[]>`
        SELECT
          COUNT(*) FILTER (WHERE loyalty_points > 0) AS total_members,
          COALESCE(SUM(loyalty_points) FILTER (WHERE loyalty_points > 0), 0) AS total_points
        FROM profiles
      `,

      // Last 20 transactions across all users
      db.$queryRaw<{
        id: string
        user_id: string
        points: number
        reason: string
        order_id: string | null
        created_at: Date
        profile_name: string | null
      }[]>`
        SELECT
          lt.id,
          lt.user_id,
          lt.points,
          lt.reason,
          lt.order_id,
          lt.created_at,
          p.name AS profile_name
        FROM loyalty_transactions lt
        LEFT JOIN profiles p ON p.id = lt.user_id
        ORDER BY lt.created_at DESC
        LIMIT 20
      `,

      // Top 10 clients by loyalty_points
      db.$queryRaw<{
        id: string
        name: string | null
        loyalty_points: number
        tx_count: bigint
      }[]>`
        SELECT
          p.id,
          p.name,
          p.loyalty_points,
          COUNT(lt.id) AS tx_count
        FROM profiles p
        LEFT JOIN loyalty_transactions lt ON lt.user_id = p.id
        WHERE p.loyalty_points > 0
        GROUP BY p.id, p.name, p.loyalty_points
        ORDER BY p.loyalty_points DESC
        LIMIT 10
      `,

      // Monthly awarded vs redeemed — last 6 months
      db.$queryRaw<{
        month: Date
        awarded: bigint
        redeemed: bigint
      }[]>`
        SELECT
          date_trunc('month', created_at) AS month,
          COALESCE(SUM(points) FILTER (WHERE points > 0), 0) AS awarded,
          COALESCE(ABS(SUM(points) FILTER (WHERE points < 0)), 0) AS redeemed
        FROM loyalty_transactions
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY 1
        ORDER BY 1
      `,
    ])

    // Redemption rate: redeemed / (redeemed + current pending points)
    const totalPending = Number((membersResult[0]?.total_points ?? BigInt(0)))
    const totalRedeemed = Number(monthlyRaw.reduce((acc, r) => acc + r.redeemed, BigInt(0)))
    const redemptionRate =
      totalRedeemed + totalPending > 0
        ? Math.round((totalRedeemed / (totalRedeemed + totalPending)) * 100)
        : 0

    return NextResponse.json({
      kpis: {
        totalMembers: Number(membersResult[0]?.total_members ?? BigInt(0)),
        totalPoints: totalPending,
        totalClp: totalPending * POINTS_TO_CLP,
        redemptionRate,
      },
      topClients: topClients.map((c) => ({
        id: c.id,
        name: c.name ?? 'Sin nombre',
        loyalty_points: c.loyalty_points,
        clp_value: c.loyalty_points * POINTS_TO_CLP,
        tx_count: Number(c.tx_count),
      })),
      recentTransactions: recentTxs.map((t) => ({
        id: t.id,
        user_id: t.user_id,
        profile_name: t.profile_name ?? 'Cliente',
        points: t.points,
        reason: t.reason,
        order_id: t.order_id,
        created_at: t.created_at.toISOString(),
      })),
      monthlyChart: monthlyRaw.map((r) => ({
        month: r.month.toISOString().slice(0, 7), // YYYY-MM
        otorgados: Number(r.awarded),
        canjeados: Number(r.redeemed),
      })),
    })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}
