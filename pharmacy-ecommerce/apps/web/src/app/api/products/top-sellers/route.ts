import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/db'

/**
 * GET /api/products/top-sellers?limit=10
 * Cached 10 min, tag: 'top-sellers' (invalidate via revalidateTag on order completion).
 */
const productSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  image_url: true,
  discount_percent: true,
  stock: true,
} as const

const computeTopSellers = unstable_cache(
  async (limit: number) => {
    const db = await getDb()
    const unitsByProduct: Record<string, number> = {}

    const soldItems = await db.order_items.findMany({
      where: {
        orders: { status: { in: ['paid', 'completed', 'approved'] } },
        product_id: { not: null },
      },
      select: { product_id: true, quantity: true },
    })
    for (const item of soldItems) {
      if (!item.product_id) continue
      unitsByProduct[item.product_id] = (unitsByProduct[item.product_id] ?? 0) + item.quantity
    }

    const historical = await db.stock_movements.findMany({
      where: { reason: 'ventas_historicas', delta: { lt: 0 }, product_id: { not: null } },
      select: { product_id: true, delta: true },
    })
    for (const m of historical) {
      if (!m.product_id) continue
      unitsByProduct[m.product_id] = (unitsByProduct[m.product_id] ?? 0) + Math.abs(m.delta)
    }

    const topIds = Object.entries(unitsByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id)

    if (topIds.length === 0) {
      const featured = await db.products.findMany({
        where: { active: true, stock: { gt: 0 }, image_url: { not: null } },
        orderBy: { stock: 'desc' },
        take: limit,
        select: productSelect,
      })
      return featured.map((p) => ({ ...p, price: p.price.toString(), units_sold: 0 }))
    }

    const products = await db.products.findMany({
      where: { id: { in: topIds }, active: true, stock: { gt: 0 } },
      select: productSelect,
    })

    const ordered = topIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean)
      .map((p) => ({ ...p!, price: p!.price.toString(), units_sold: unitsByProduct[p!.id] }))

    if (ordered.length < limit) {
      const existingIds = ordered.map((p) => p.id)
      const needed = limit - ordered.length
      const padding = await db.products.findMany({
        where: { active: true, stock: { gt: 0 }, image_url: { not: null }, id: { notIn: existingIds } },
        orderBy: { stock: 'desc' },
        take: needed,
        select: productSelect,
      })
      ordered.push(...padding.map((p) => ({ ...p, price: p.price.toString(), units_sold: 0 })))
    }

    return ordered
  },
  ['top-sellers'],
  { tags: ['top-sellers', 'products'], revalidate: 600 }
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)
  const data = await computeTopSellers(limit)
  return NextResponse.json(data)
}
