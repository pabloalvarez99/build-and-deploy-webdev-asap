import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { expandQuery } from '@/lib/search-synonyms'

export const dynamic = 'force-dynamic'

function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null
  return url.startsWith('http://') ? 'https://' + url.slice(7) : url
}

type MatchField = 'name' | 'active_ingredient' | 'laboratory' | 'therapeutic_action' | null

function pickMatch(
  p: { name: string | null; active_ingredient: string | null; laboratory: string | null; therapeutic_action: string | null },
  variants: string[],
): { match_field: MatchField; match_value: string | null } {
  const fields: Array<[MatchField, string | null]> = [
    ['name', p.name],
    ['active_ingredient', p.active_ingredient],
    ['laboratory', p.laboratory],
    ['therapeutic_action', p.therapeutic_action],
  ]
  for (const [field, value] of fields) {
    if (!value) continue
    const lower = value.toLowerCase()
    for (const v of variants) {
      if (lower.includes(v)) return { match_field: field, match_value: value }
    }
  }
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

  const variants = expandQuery(q)
  const orConds = variants.flatMap((v) => [
    { name: { contains: v, mode: 'insensitive' as const } },
    { active_ingredient: { contains: v, mode: 'insensitive' as const } },
    { laboratory: { contains: v, mode: 'insensitive' as const } },
    { therapeutic_action: { contains: v, mode: 'insensitive' as const } },
  ])

  try {
    const [products, categories] = await Promise.all([
      db.products.findMany({
        where: {
          active: true,
          OR: orConds,
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
        where: {
          active: true,
          OR: variants.map((v) => ({ name: { contains: v, mode: 'insensitive' as const } })),
        },
        select: { name: true, slug: true },
        take: 3,
      }),
    ])

    return NextResponse.json({
      q,
      variants,
      products: products.map((p) => {
        const { match_field, match_value } = pickMatch(p, variants)
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
