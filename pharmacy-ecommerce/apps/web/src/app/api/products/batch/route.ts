import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null
  return url.startsWith('http://') ? 'https://' + url.slice(7) : url
}

// POST /api/products/batch — get multiple products by ids
export async function POST(request: NextRequest) {
  const { ids } = await request.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json([])

  const db = await getDb()
  const products = await db.products.findMany({
    where: { id: { in: ids } },
    include: { categories: { select: { name: true, slug: true } } },
  })

  return NextResponse.json(products.map((p) => ({
    id: p.id, name: p.name, slug: p.slug, description: p.description,
    price: p.price.toString(), stock: p.stock, category_id: p.category_id,
    image_url: sanitizeImageUrl(p.image_url), active: p.active,
    external_id: p.external_id, laboratory: p.laboratory,
    therapeutic_action: p.therapeutic_action, active_ingredient: p.active_ingredient,
    prescription_type: p.prescription_type, presentation: p.presentation,
    discount_percent: p.discount_percent, created_at: p.created_at.toISOString(),
    category_name: p.categories?.name ?? null, category_slug: p.categories?.slug ?? null,
  })))
}
