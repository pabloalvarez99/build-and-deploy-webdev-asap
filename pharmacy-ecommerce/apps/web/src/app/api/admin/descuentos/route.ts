import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { getDb } from '@/lib/db';

/**
 * GET /api/admin/descuentos
 * Returns: active discount summary, loyalty program stats, loyalty settings
 */
export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();

    const [
      discountedProducts,
      categories,
      loyaltySettings,
      loyaltyUserCount,
      pointsAgg,
      recentTransactions,
    ] = await Promise.all([
      db.products.findMany({
        where: { discount_percent: { gt: 0 }, active: true },
        select: { id: true, name: true, price: true, discount_percent: true, category_id: true, stock: true, image_url: true },
        orderBy: { discount_percent: 'desc' },
        take: 200,
      }),
      db.categories.findMany({ select: { id: true, name: true } }),
      db.admin_settings.findMany({
        where: { key: { in: ['loyalty_points_per_clp', 'loyalty_clp_per_point', 'loyalty_enabled'] } },
      }),
      db.profiles.count({ where: { loyalty_points: { gt: 0 } } }),
      db.profiles.aggregate({ _sum: { loyalty_points: true } }),
      db.loyalty_transactions.findMany({
        orderBy: { created_at: 'desc' },
        take: 10,
        select: { id: true, points: true, reason: true, user_id: true, created_at: true },
      }),
    ]);

    const settingsMap: Record<string, string> = {};
    for (const s of loyaltySettings) settingsMap[s.key] = s.value;

    const pointsPerClp = parseInt(settingsMap['loyalty_points_per_clp'] ?? '1000');
    const clpPerPoint = parseInt(settingsMap['loyalty_clp_per_point'] ?? '100');
    const loyaltyEnabled = settingsMap['loyalty_enabled'] !== 'false';

    const categoryMap: Record<string, string> = {};
    for (const c of categories) categoryMap[c.id] = c.name;

    const byCategory: Record<string, { name: string; count: number; avg_discount: number }> = {};
    for (const p of discountedProducts) {
      const cid = p.category_id ?? 'sin_categoria';
      const cname = categoryMap[cid] ?? 'Sin categoría';
      if (!byCategory[cid]) byCategory[cid] = { name: cname, count: 0, avg_discount: 0 };
      byCategory[cid].count++;
      byCategory[cid].avg_discount += p.discount_percent ?? 0;
    }
    for (const v of Object.values(byCategory)) {
      v.avg_discount = Math.round(v.avg_discount / v.count);
    }

    return NextResponse.json({
      summary: {
        total_discounted: discountedProducts.length,
        by_category: Object.values(byCategory).sort((a, b) => b.count - a.count),
      },
      products: discountedProducts.map(p => ({
        ...p,
        price: p.price.toString(),
        category_name: categoryMap[p.category_id ?? ''] ?? 'Sin categoría',
      })),
      categories: categories.map(c => ({ id: c.id, name: c.name })),
      loyalty: {
        enabled: loyaltyEnabled,
        points_per_clp: pointsPerClp,
        clp_per_point: clpPerPoint,
        total_users_with_points: loyaltyUserCount,
        total_points_in_circulation: pointsAgg._sum.loyalty_points ?? 0,
        total_clp_equivalent: ((pointsAgg._sum.loyalty_points ?? 0) * clpPerPoint),
        recent_transactions: recentTransactions.map(t => ({ ...t, created_at: t.created_at.toISOString() })),
      },
    });
  } catch (e) {
    console.error('descuentos GET error:', e);
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
}

/**
 * POST /api/admin/descuentos
 * action: 'apply_bulk' | 'remove_bulk' | 'update_loyalty'
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();
    const { action } = body;
    const db = await getDb();

    if (action === 'apply_bulk') {
      const { scope, category_id, discount_percent, product_ids } = body;
      if (typeof discount_percent !== 'number' || discount_percent < 0 || discount_percent > 99) {
        return errorResponse('discount_percent debe ser entre 0 y 99', 400);
      }

      let where: Parameters<typeof db.products.updateMany>[0]['where'] = { active: true };
      if (scope === 'category' && category_id) {
        where = { ...where, category_id };
      } else if (scope === 'products' && Array.isArray(product_ids)) {
        where = { id: { in: product_ids } };
      }

      const result = await db.products.updateMany({ where, data: { discount_percent } });
      return NextResponse.json({ success: true, updated: result.count });
    }

    if (action === 'remove_bulk') {
      const { scope, category_id } = body;
      let where: Parameters<typeof db.products.updateMany>[0]['where'] = { discount_percent: { gt: 0 } };
      if (scope === 'category' && category_id) {
        where = { ...where, category_id };
      }
      const result = await db.products.updateMany({ where, data: { discount_percent: 0 } });
      return NextResponse.json({ success: true, updated: result.count });
    }

    if (action === 'update_loyalty') {
      const { points_per_clp, clp_per_point, loyalty_enabled } = body;
      const updates: { key: string; value: string }[] = [];
      if (typeof points_per_clp === 'number') updates.push({ key: 'loyalty_points_per_clp', value: String(points_per_clp) });
      if (typeof clp_per_point === 'number') updates.push({ key: 'loyalty_clp_per_point', value: String(clp_per_point) });
      if (typeof loyalty_enabled === 'boolean') updates.push({ key: 'loyalty_enabled', value: String(loyalty_enabled) });

      for (const { key, value } of updates) {
        await db.admin_settings.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
      }
      return NextResponse.json({ success: true });
    }

    return errorResponse('Acción no reconocida', 400);
  } catch (e) {
    console.error('descuentos POST error:', e);
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
}
