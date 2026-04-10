import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * GET /api/products/top-sellers?limit=10
 * Retorna los N productos más vendidos por unidades (últimos 90 días).
 * Público — no requiere autenticación.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

  const db = await getDb()

  const since = new Date()
  since.setDate(since.getDate() - 90)

  // Agrupamos order_items de órdenes completadas (paid/processing/shipped/delivered)
  const items = await db.order_items.findMany({
    where: {
      orders: {
        status: { in: ['paid', 'processing', 'shipped', 'delivered'] },
        created_at: { gte: since },
      },
      product_id: { not: null },
    },
    select: {
      product_id: true,
      quantity: true,
    },
  })

  // Sumar unidades por producto
  const unitsByProduct: Record<string, number> = {}
  for (const item of items) {
    if (!item.product_id) continue
    unitsByProduct[item.product_id] = (unitsByProduct[item.product_id] ?? 0) + item.quantity
  }

  const topIds = Object.entries(unitsByProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  if (topIds.length === 0) {
    return NextResponse.json([])
  }

  const products = await db.products.findMany({
    where: { id: { in: topIds }, active: true, stock: { gt: 0 } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      image_url: true,
      discount_percent: true,
      stock: true,
    },
  })

  // Ordenar según el ranking original
  const ordered = topIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => ({ ...p!, price: p!.price.toString(), units_sold: unitsByProduct[p!.id] }))

  return NextResponse.json(ordered)
}
