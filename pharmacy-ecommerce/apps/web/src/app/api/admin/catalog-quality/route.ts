import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { Prisma } from '@prisma/client';

type IssueType = 'sin_imagen' | 'sin_precio' | 'sin_stock' | 'sin_costo' | 'sin_categoria';

interface RawProduct {
  id: string;
  name: string;
  price: Prisma.Decimal | null;
  stock: number;
  image_url: string | null;
  category_id: string | null;
  cost_price: Prisma.Decimal | null;
  active: boolean;
}

function computeIssues(p: RawProduct): IssueType[] {
  const issues: IssueType[] = [];
  if (!p.image_url || p.image_url.trim() === '') issues.push('sin_imagen');
  if (p.price === null || Number(p.price) === 0) issues.push('sin_precio');
  if (p.stock === 0) issues.push('sin_stock');
  if (p.cost_price === null) issues.push('sin_costo');
  if (p.category_id === null) issues.push('sin_categoria');
  return issues;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = new URL(request.url);
    const issueFilter = searchParams.get('issue') as IssueType | null;

    const db = await getDb();

    // Stats: counts per issue type (active products only)
    const [
      totalActive,
      totalInactive,
      missingImage,
      missingPrice,
      zeroStock,
      noCategory,
      noCost,
    ] = await Promise.all([
      db.products.count({ where: { active: true } }),
      db.products.count({ where: { active: false } }),
      db.products.count({
        where: { active: true, OR: [{ image_url: null }, { image_url: '' }] },
      }),
      db.products.count({
        where: { active: true, price: 0 },
      }),
      db.products.count({ where: { active: true, stock: 0 } }),
      db.products.count({ where: { active: true, category_id: null } }),
      db.products.count({ where: { active: true, cost_price: null } }),
    ]);

    // Build where clause for issue filter
    let issueWhere: Prisma.productsWhereInput = { active: true };
    if (issueFilter === 'sin_imagen') {
      issueWhere = { active: true, OR: [{ image_url: null }, { image_url: '' }] };
    } else if (issueFilter === 'sin_precio') {
      issueWhere = { active: true, price: 0 };
    } else if (issueFilter === 'sin_stock') {
      issueWhere = { active: true, stock: 0 };
    } else if (issueFilter === 'sin_costo') {
      issueWhere = { active: true, cost_price: null };
    } else if (issueFilter === 'sin_categoria') {
      issueWhere = { active: true, category_id: null };
    } else {
      // No filter: only products with at least one issue
      issueWhere = {
        active: true,
        OR: [
          { image_url: null },
          { image_url: '' },
          { price: 0 },
          { stock: 0 },
          { cost_price: null },
          { category_id: null },
        ],
      };
    }

    // Fetch all matching active products with issues (we sort by issue count in JS)
    const rawProducts = await db.products.findMany({
      where: issueWhere,
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        image_url: true,
        category_id: true,
        cost_price: true,
        active: true,
      },
      take: 500, // fetch more than needed to sort by issue count
    });

    // Compute issues per product and sort by count desc, take top 100
    const withIssues = rawProducts
      .map((p) => {
        const issues = computeIssues(p as RawProduct);
        return {
          id: p.id,
          name: p.name,
          price: p.price !== null ? Number(p.price) : null,
          stock: p.stock,
          image_url: p.image_url,
          category_id: p.category_id,
          cost_price: p.cost_price !== null ? Number(p.cost_price) : null,
          active: p.active,
          issues,
        };
      })
      .filter((p) => p.issues.length > 0)
      .sort((a, b) => b.issues.length - a.issues.length)
      .slice(0, 100);

    return NextResponse.json({
      stats: {
        total_active: totalActive,
        total_inactive: totalInactive,
        missing_image: missingImage,
        missing_price: missingPrice,
        zero_stock: zeroStock,
        no_category: noCategory,
        no_cost: noCost,
      },
      issues: withIssues,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
