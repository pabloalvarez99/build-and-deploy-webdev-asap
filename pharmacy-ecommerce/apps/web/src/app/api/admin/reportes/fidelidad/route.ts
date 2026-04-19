import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { getDb } from '@/lib/db';

/**
 * GET /api/admin/reportes/fidelidad?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from') || (() => {
      const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
    })();
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    const fromDate = new Date(from + 'T00:00:00.000Z');
    const toDate = new Date(to + 'T23:59:59.999Z');

    const db = await getDb();

    const [transactions, topProfiles, settingsPts] = await Promise.all([
      db.loyalty_transactions.findMany({
        where: { created_at: { gte: fromDate, lte: toDate } },
        select: { points: true, reason: true, user_id: true, created_at: true },
        orderBy: { created_at: 'asc' },
      }),
      db.profiles.findMany({
        where: { loyalty_points: { gt: 0 } },
        select: { id: true, name: true, loyalty_points: true },
        orderBy: { loyalty_points: 'desc' },
        take: 10,
      }),
      db.admin_settings.findMany({
        where: { key: { in: ['loyalty_points_per_clp', 'loyalty_clp_per_point', 'loyalty_enabled'] } },
      }),
    ]);

    const settingsMap: Record<string, string> = {};
    for (const s of settingsPts) settingsMap[s.key] = s.value;
    const clpPerPoint = parseInt(settingsMap['loyalty_clp_per_point'] ?? '100');

    const awarded = transactions.filter(t => t.points > 0).reduce((s, t) => s + t.points, 0);
    const redeemed = Math.abs(transactions.filter(t => t.points < 0).reduce((s, t) => s + t.points, 0));
    const net = awarded - redeemed;

    // Unique users who earned/redeemed in period
    const uniqueEarners = new Set(transactions.filter(t => t.points > 0).map(t => t.user_id)).size;
    const uniqueRedeemers = new Set(transactions.filter(t => t.points < 0).map(t => t.user_id)).size;

    // By reason breakdown
    const byReason: Record<string, { count: number; points: number }> = {};
    for (const t of transactions) {
      if (!byReason[t.reason]) byReason[t.reason] = { count: 0, points: 0 };
      byReason[t.reason].count++;
      byReason[t.reason].points += t.points;
    }

    // By week trend
    const weekMap: Record<string, { week: string; awarded: number; redeemed: number }> = {};
    for (const t of transactions) {
      const d = new Date(t.created_at);
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - day + 1);
      const wk = d.toISOString().split('T')[0];
      if (!weekMap[wk]) weekMap[wk] = { week: wk, awarded: 0, redeemed: 0 };
      if (t.points > 0) weekMap[wk].awarded += t.points;
      else weekMap[wk].redeemed += Math.abs(t.points);
    }
    const byWeek = Object.values(weekMap).sort((a, b) => a.week.localeCompare(b.week));

    return NextResponse.json({
      kpis: {
        awarded,
        redeemed,
        net,
        unique_earners: uniqueEarners,
        unique_redeemers: uniqueRedeemers,
        clp_awarded: awarded * clpPerPoint,
        clp_redeemed: redeemed * clpPerPoint,
      },
      by_reason: Object.entries(byReason)
        .map(([reason, v]) => ({ reason, ...v }))
        .sort((a, b) => Math.abs(b.points) - Math.abs(a.points)),
      by_week: byWeek,
      top_holders: topProfiles.map(p => ({
        id: p.id,
        name: p.name ?? 'Sin nombre',
        loyalty_points: p.loyalty_points,
        clp_value: p.loyalty_points * clpPerPoint,
      })),
    });
  } catch (e) {
    console.error('reportes/fidelidad error:', e);
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
}
