import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/db'

function sanitizeImageUrl(url: string | null): string | null {
  if (!url) return null
  return url.startsWith('http://') ? 'https://' + url.slice(7) : url
}

function mapProduct(p: any) {
  return {
    id: p.id, name: p.name, slug: p.slug, description: p.description,
    price: p.price.toString(), stock: p.stock, category_id: p.category_id,
    image_url: sanitizeImageUrl(p.image_url), active: p.active,
    external_id: p.external_id, laboratory: p.laboratory,
    therapeutic_action: p.therapeutic_action, active_ingredient: p.active_ingredient,
    prescription_type: p.prescription_type, presentation: p.presentation,
    discount_percent: p.discount_percent,
    created_at: p.created_at.toISOString(),
    category_name: p.categories?.name ?? null,
    category_slug: p.categories?.slug ?? null,
  }
}

const getCachedProduct = unstable_cache(
  async (slug: string) => {
    const db = await getDb()
    const product = await db.products.findFirst({
      where: { slug },
      include: { categories: { select: { name: true, slug: true } } },
    })
    if (!product) return null
    return mapProduct(product)
  },
  ['product-by-slug'],
  { tags: ['products'], revalidate: 600 }
)

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const data = await getCachedProduct(params.slug)
  if (!data) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  return NextResponse.json(data)
}
