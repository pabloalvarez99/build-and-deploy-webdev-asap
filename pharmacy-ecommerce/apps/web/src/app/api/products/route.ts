import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/db'
import type { MatchField } from '@/lib/api'

function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null
  return url.startsWith('http://') ? 'https://' + url.slice(7) : url
}

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

function mapProduct(p: any, searchQ = '') {
  const { match_field, match_value } = searchQ ? getMatchField(p, searchQ) : { match_field: null, match_value: null }
  return {
    id: p.id, name: p.name, slug: p.slug, description: p.description,
    price: p.price.toString(), stock: p.stock, category_id: p.category_id,
    image_url: sanitizeImageUrl(p.image_url), active: p.active,
    external_id: p.external_id, laboratory: p.laboratory,
    therapeutic_action: p.therapeutic_action, active_ingredient: p.active_ingredient,
    prescription_type: p.prescription_type, presentation: p.presentation,
    discount_percent: p.discount_percent,
    cost_price: p.cost_price != null ? p.cost_price.toString() : null,
    created_at: p.created_at.toISOString(),
    category_name: p.categories?.name ?? null,
    category_slug: p.categories?.slug ?? null,
    match_field, match_value,
  }
}

interface CatalogOpts {
  page: number; limit: number; activeOnly: boolean;
  categorySlug: string | null; sort_by: string | null;
  laboratory: string | null; therapeutic_action: string | null;
  prescription_type: string | null; active_ingredient: string | null;
  in_stock: string | null; no_image: string | null; has_discount: string | null;
  no_external_id: string | null; no_barcode: string | null;
  min_price: string | null; max_price: string | null; stock_filter: string | null;
}

async function fetchCatalog(opts: CatalogOpts) {
  const db = await getDb()
  const offset = (opts.page - 1) * opts.limit
  const where: Record<string, unknown> = {}
  if (opts.activeOnly) where.active = true

  if (opts.categorySlug) {
    const cat = await db.categories.findFirst({ where: { slug: opts.categorySlug }, select: { id: true } })
    if (cat) where.category_id = cat.id
    else return { products: [], total: 0, page: opts.page, limit: opts.limit, total_pages: 0 }
  }

  if (opts.laboratory) where.laboratory = opts.laboratory
  if (opts.therapeutic_action) where.therapeutic_action = opts.therapeutic_action
  if (opts.prescription_type) where.prescription_type = opts.prescription_type
  if (opts.active_ingredient) where.active_ingredient = { contains: opts.active_ingredient, mode: 'insensitive' }
  if (opts.in_stock === 'true') where.stock = { gt: 0 }
  if (opts.no_image === 'true') where.image_url = null
  if (opts.has_discount === 'true') where.discount_percent = { gt: 0 }
  if (opts.no_external_id === 'true') where.external_id = null
  if (opts.no_barcode === 'true') where.product_barcodes = { none: {} }

  if (opts.min_price || opts.max_price) {
    where.price = {
      ...(opts.min_price ? { gte: Number(opts.min_price) } : {}),
      ...(opts.max_price ? { lte: Number(opts.max_price) } : {}),
    }
  }

  const sf = opts.stock_filter
  if (sf === 'out') where.stock = { lte: 0 }
  if (sf === 'low') where.stock = { gt: 0, lte: 10 }
  if (sf === 'excel_agotado') {
    where.stock = { lte: 0 }
    where.stock_movements = { some: { reason: { in: ['import_excel', 'agotado_excel'] } } }
  }

  let orderBy: Record<string, string> = { created_at: 'desc' }
  switch (opts.sort_by) {
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

  const [products, total] = await Promise.all([
    db.products.findMany({
      where,
      include: { categories: { select: { name: true, slug: true } } },
      orderBy,
      skip: offset,
      take: opts.limit,
    }),
    db.products.count({ where }),
  ])

  return {
    products: products.map((p) => mapProduct(p)),
    total,
    page: opts.page,
    limit: opts.limit,
    total_pages: Math.ceil(total / opts.limit),
  }
}

const getCachedCatalog = unstable_cache(fetchCatalog, ['products-catalog'], {
  tags: ['products'],
  revalidate: 300,
})

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const searchQ = searchParams.get('search')
  const barcodeVal = searchParams.get('barcode')

  // Dynamic queries (search/barcode) — skip cache
  if (searchQ || barcodeVal) {
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
    const where: Record<string, unknown> = {}
    if (activeOnly) where.active = true

    if (searchQ) {
      where.OR = [
        { name: { contains: searchQ, mode: 'insensitive' } },
        { description: { contains: searchQ, mode: 'insensitive' } },
        { laboratory: { contains: searchQ, mode: 'insensitive' } },
        { active_ingredient: { contains: searchQ, mode: 'insensitive' } },
        { therapeutic_action: { contains: searchQ, mode: 'insensitive' } },
      ]
    }

    if (barcodeVal) {
      const barcodeRecord = await db.product_barcodes.findUnique({
        where: { barcode: barcodeVal },
        select: { product_id: true },
      })
      if (barcodeRecord) {
        where.id = barcodeRecord.product_id
      } else {
        where.external_id = barcodeVal
      }
    }

    let products: any[], total: number
    try {
      ;[products, total] = await Promise.all([
        db.products.findMany({
          where,
          include: { categories: { select: { name: true, slug: true } } },
          orderBy: { created_at: 'desc' },
          skip: offset,
          take: limit,
        }),
        db.products.count({ where }),
      ])
    } catch (err: any) {
      console.error('[QUERY_ERROR]', err?.code, err?.message, err?.meta)
      return NextResponse.json({ error: 'Query failed', code: err?.code, detail: err?.message }, { status: 500 })
    }

    return NextResponse.json({
      products: products.map((p) => mapProduct(p, searchQ ?? '')),
      total, page, limit, total_pages: Math.ceil(total / limit),
    })
  }

  // Cacheable queries
  const opts: CatalogOpts = {
    page: Math.max(1, Number(searchParams.get('page') || 1)),
    limit: Math.min(Number(searchParams.get('limit') || 12), 100),
    activeOnly: searchParams.get('active_only') !== 'false',
    categorySlug: searchParams.get('category'),
    sort_by: searchParams.get('sort_by'),
    laboratory: searchParams.get('laboratory'),
    therapeutic_action: searchParams.get('therapeutic_action'),
    prescription_type: searchParams.get('prescription_type'),
    active_ingredient: searchParams.get('active_ingredient'),
    in_stock: searchParams.get('in_stock'),
    no_image: searchParams.get('no_image'),
    has_discount: searchParams.get('has_discount'),
    no_external_id: searchParams.get('no_external_id'),
    no_barcode: searchParams.get('no_barcode'),
    min_price: searchParams.get('min_price'),
    max_price: searchParams.get('max_price'),
    stock_filter: searchParams.get('stock_filter'),
  }

  try {
    const data = await getCachedCatalog(opts)
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[QUERY_ERROR]', err?.code, err?.message, err?.meta)
    return NextResponse.json({ error: 'Query failed', code: err?.code, detail: err?.message }, { status: 500 })
  }
}
