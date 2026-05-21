import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return errorResponse('Unauthorized', 403);

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
  const limit = Math.min(200, Math.max(10, parseInt(sp.get('limit') || '50', 10)));
  const offset = (page - 1) * limit;
  const q = (sp.get('q') || '').trim();
  const status = sp.get('status') || 'all';
  const enrich = sp.get('enrich') || 'all';
  const hasImage = sp.get('has_image');

  const where: string[] = [];
  const params: unknown[] = [];
  let i = 1;

  if (q) {
    where.push(`(description ILIKE $${i} OR ecosur_id = $${i + 1} OR $${i + 2} = ANY(barcodes))`);
    params.push(`%${q}%`, q, q);
    i += 3;
  }
  if (status === 'active') where.push(`status = 'ACTV'`);
  else if (status === 'inactive') where.push(`status <> 'ACTV'`);
  if (enrich !== 'all') { where.push(`enrich_status = $${i}`); params.push(enrich); i++; }
  if (hasImage === '1') where.push(`image_url IS NOT NULL AND image_url <> ''`);
  else if (hasImage === '0') where.push(`(image_url IS NULL OR image_url = '')`);

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const db = await getDb();

  const countRes = await db.$queryRawUnsafe<Array<{ count: bigint }>>(
    `SELECT COUNT(*) AS count FROM rp_catalog ${whereSql}`,
    ...params,
  );
  const total = Number(countRes[0]?.count ?? 0);

  const items = await db.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT ecosur_id, description, suggested_price, status, barcodes, image_url, laboratory,
            active_ingredient, therapeutic_action, product_type, presentation, dose, form,
            enrich_status, enrich_attempts, last_enriched_at, updated_at
       FROM rp_catalog
       ${whereSql}
       ORDER BY description ASC
       LIMIT ${limit} OFFSET ${offset}`,
    ...params,
  );

  const stats = await db.$queryRaw<Array<{
    total: bigint; with_image: bigint; with_lab: bigint;
    scraped: bigint; heuristic: bigint; failed: bigint; pending: bigint;
  }>>`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE image_url IS NOT NULL AND image_url <> '') AS with_image,
      COUNT(*) FILTER (WHERE laboratory IS NOT NULL) AS with_lab,
      COUNT(*) FILTER (WHERE enrich_status = 'scraped') AS scraped,
      COUNT(*) FILTER (WHERE enrich_status = 'heuristic') AS heuristic,
      COUNT(*) FILTER (WHERE enrich_status = 'failed') AS failed,
      COUNT(*) FILTER (WHERE enrich_status = 'pending') AS pending
    FROM rp_catalog
  `;

  const s = stats[0];
  return NextResponse.json({
    items,
    page,
    limit,
    total,
    stats: s ? {
      total: Number(s.total),
      with_image: Number(s.with_image),
      with_lab: Number(s.with_lab),
      scraped: Number(s.scraped),
      heuristic: Number(s.heuristic),
      failed: Number(s.failed),
      pending: Number(s.pending),
    } : null,
  });
}
