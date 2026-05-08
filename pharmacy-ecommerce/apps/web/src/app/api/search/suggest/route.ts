import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null
  return url.startsWith('http://') ? 'https://' + url.slice(7) : url
}

type MatchField = 'name' | 'active_ingredient' | 'laboratory' | 'therapeutic_action' | null

function pickMatch(
  p: { name: string | null; active_ingredient: string | null; laboratory: string | null; therapeutic_action: string | null },
  lq: string,
): { match_field: MatchField; match_value: string | null } {
  if (p.name?.toLowerCase().includes(lq)) return { match_field: 'name', match_value: p.name }
  if (p.active_ingredient?.toLowerCase().includes(lq)) return { match_field: 'active_ingredient', match_value: p.active_ingredient }
  if (p.laboratory?.toLowerCase().includes(lq)) return { match_field: 'laboratory', match_value: p.laboratory }
  if (p.therapeutic_action?.toLowerCase().includes(lq)) return { match_field: 'therapeutic_action', match_value: p.therapeutic_action }
  return { match_field: null, match_value: null }
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') || '').trim()
  if (q.length < 2) {
    return NextResponse.json({ q, products: [], categories: [] })
  }

  let db
  try {
    db = await getDb()
  } catch (err: any) {
    console.error('[SUGGEST_DB_ERR]', err?.message)
    return NextResponse.json({ q, products: [], categories: [], error: 'DB' }, { status: 500 })
  }

  try {
    const [products, categories] = await Promise.all([
      db.products.findMany({
        where: {
          active: true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { active_ingredient: { contains: q, mode: 'insensitive' } },
            { laboratory: { contains: q, mode: 'insensitive' } },
            { therapeutic_action: { contains: q, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true, name: true, slug: true, image_url: true,
          price: true, discount_percent: true, stock: true,
          laboratory: true, active_ingredient: true, therapeutic_action: true,
          categories: { select: { name: true, slug: true } },
        },
        orderBy: [{ stock: 'desc' }, { name: 'asc' }],
        take: 8,
      }),
      db.categories.findMany({
        where: { active: true, name: { contains: q, mode: 'insensitive' } },
        select: { name: true, slug: true },
        take: 3,
      }),
    ])

    const lq = q.toLowerCase()
    return NextResponse.json({
      q,
      products: products.map((p) => {
        const { match_field, match_value } = pickMatch(p, lq)
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          image_url: sanitizeImageUrl(p.image_url),
          price: p.price.toString(),
          discount_percent: p.discount_percent,
          stock: p.stock,
          laboratory: p.laboratory,
          category_name: p.categories?.name ?? null,
          category_slug: p.categories?.slug ?? null,
          match_field,
          match_value,
        }
      }),
      categories,
    })
  } catch (err: any) {
    console.error('[SUGGEST_QUERY_ERR]', err?.code, err?.message)
    return NextResponse.json({ q, products: [], categories: [], error: 'QUERY' }, { status: 500 })
  }
}
