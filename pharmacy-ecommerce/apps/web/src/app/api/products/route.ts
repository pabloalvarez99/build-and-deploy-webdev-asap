import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null
  return url.startsWith('http://') ? 'https://' + url.slice(7) : url
}

type MatchField = 'active_ingredient' | 'therapeutic_action' | 'laboratory' | null

function getMatchField(
  p: { name: string | null; active_ingredient: string | null; therapeutic_action: string | null; laboratory: string | null },
  q: string
): { match_field: MatchField; match_value: string | null } {
  const lq = q.toLowerCase()
  if (p.name?.toLowerCase().includes(lq)) return { match_field: null, match_value: null }
  if (p.active_ingredient?.toLowerCase().includes(lq))
    return { match_field: 'active_ingredient', match_value: p.active_ingredient }
  if (p.therapeutic_action?.toLowerCase().includes(lq))
    return { match_field: 'therapeutic_action', match_value: p.therapeutic_action }
  if (p.laboratory?.toLowerCase().includes(lq))
    return { match_field: 'laboratory', match_value: p.laboratory }
  return { match_field: null, match_value: null }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  let db
  try {
    db = await getDb()
  } catch (err: any) {
    console.error('[DB_INIT_ERROR]', err?.message, err?.code, err?.cause?.message)
    return NextResponse.json({ error: 'DB connection failed', detail: err?.message }, { status: 500 })
  }

  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const limit = Math.min(Number(searchParams.get('limit') || 12), 100)
  const offset = (page - 1) * limit
  const activeOnly = searchParams.get('active_only') !== 'false'

  // Build where clause
  const where: Record<string, unknown> = {}
  if (activeOnly) where.active = true

  const categorySlug = searchParams.get('category')
  if (categorySlug) {
    const cat = await db.categories.findFirst({ where: { slug: categorySlug }, select: { id: true } })
    if (cat) where.category_id = cat.id
    else return NextResponse.json({ products: [], total: 0, page, limit, total_pages: 0 })
  }

  if (searchParams.get('laboratory')) where.laboratory = searchParams.get('laboratory')
  if (searchParams.get('therapeutic_action')) where.therapeutic_action = searchParams.get('therapeutic_action')
  if (searchParams.get('prescription_type')) where.prescription_type = searchParams.get('prescription_type')
  if (searchParams.get('active_ingredient'))
    where.active_ingredient = { contains: searchParams.get('active_ingredient'), mode: 'insensitive' }
  if (searchParams.get('search')) {
    const s = searchParams.get('search')!
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
      { laboratory: { contains: s, mode: 'insensitive' } },
      { active_ingredient: { contains: s, mode: 'insensitive' } },
      { therapeutic_action: { contains: s, mode: 'insensitive' } },
    ]
  }
  const barcodeVal = searchParams.get('barcode')
  if (barcodeVal) {
    const barcodeRecord = await db.product_barcodes.findUnique({
      where: { barcode: barcodeVal },
      select: { product_id: true },
    })
    if (barcodeRecord) {
      where.id = barcodeRecord.product_id
    } else {
      // Fallback: intentar por external_id (compatibilidad anterior)
      where.external_id = barcodeVal
    }
  }
  if (searchParams.get('in_stock') === 'true') where.stock = { gt: 0 }
  if (searchParams.get('no_image') === 'true') where.image_url = null
  if (searchParams.get('has_discount') === 'true') where.discount_percent = { gt: 0 }
  if (searchParams.get('no_external_id') === 'true') where.external_id = null
  if (searchParams.get('no_barcode') === 'true') where.product_barcodes = { none: {} }

  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')
  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice ? { gte: Number(minPrice) } : {}),
      ...(maxPrice ? { lte: Number(maxPrice) } : {}),
    }
  }

  const stockFilter = searchParams.get('stock_filter')
  if (stockFilter === 'out') where.stock = { lte: 0 }
  if (stockFilter === 'low') where.stock = { gt: 0, lte: 10 }

  // Sorting
  let orderBy: Record<string, string> = { created_at: 'desc' }
  switch (searchParams.get('sort_by')) {
    case 'name': case 'name_asc': orderBy = { name: 'asc' }; break
    case 'name_desc': orderBy = { name: 'desc' }; break
    case 'price_asc': orderBy = { price: 'asc' }; break
    case 'price_desc': orderBy = { price: 'desc' }; break
    case 'stock': case 'stock_desc': orderBy = { stock: 'desc' }; break
    case 'stock_asc': orderBy = { stock: 'asc' }; break
    case 'laboratory_asc': orderBy = { laboratory: 'asc' }; break
    case 'laboratory_desc': orderBy = { laboratory: 'desc' }; break
    case 'discount_asc': orderBy = { discount_percent: 'asc' }; break
    case 'discount_desc': orderBy = { discount_percent: 'desc' }; break
  }

  let products: any[], total: number
  try {
    ;[products, total] = await Promise.all([
      db.products.findMany({
        where,
        include: { categories: { select: { name: true, slug: true } } },
        orderBy,
        skip: offset,
        take: limit,
      }),
      db.products.count({ where }),
    ])
  } catch (err: any) {
    console.error('[QUERY_ERROR]', err?.code, err?.message, err?.meta)
    return NextResponse.json({ error: 'Query failed', code: err?.code, detail: err?.message }, { status: 500 })
  }

  const searchQ = searchParams.get('search') ?? ''

  const data = products.map((p) => {
    const { match_field, match_value } = searchQ ? getMatchField(p, searchQ) : { match_field: null, match_value: null }
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price.toString(),
      stock: p.stock,
      category_id: p.category_id,
      image_url: sanitizeImageUrl(p.image_url),
      active: p.active,
      external_id: p.external_id,
      laboratory: p.laboratory,
      therapeutic_action: p.therapeutic_action,
      active_ingredient: p.active_ingredient,
      prescription_type: p.prescription_type,
      presentation: p.presentation,
      discount_percent: p.discount_percent,
      cost_price: p.cost_price != null ? p.cost_price.toString() : null,
      created_at: p.created_at.toISOString(),
      category_name: p.categories?.name ?? null,
      category_slug: p.categories?.slug ?? null,
      match_field,
      match_value,
    }
  })

  return NextResponse.json({ products: data, total, page, limit, total_pages: Math.ceil(total / limit) })
}
