import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null
  return url.startsWith('http://') ? 'https://' + url.slice(7) : url
}

// GET /api/products/id?id=xxx — get product by id
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const db = await getDb()
  const product = await db.products.findUnique({
    where: { id },
    include: { categories: { select: { name: true, slug: true } } },
  })
  if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  return NextResponse.json({
    id: product.id, name: product.name, slug: product.slug, description: product.description,
    price: product.price.toString(), stock: product.stock, category_id: product.category_id,
    image_url: sanitizeImageUrl(product.image_url), active: product.active,
    external_id: product.external_id, laboratory: product.laboratory,
    therapeutic_action: product.therapeutic_action, active_ingredient: product.active_ingredient,
    prescription_type: product.prescription_type, presentation: product.presentation,
    discount_percent: product.discount_percent,
    created_at: product.created_at.toISOString(),
    category_name: product.categories?.name ?? null,
    category_slug: product.categories?.slug ?? null,
  })
}
