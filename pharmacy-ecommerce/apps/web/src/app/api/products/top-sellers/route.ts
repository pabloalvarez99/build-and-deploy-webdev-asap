import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * GET /api/products/top-sellers?limit=10
 * Retorna los N productos más vendidos según order_items de órdenes pagadas/completadas.
 * Fallback: productos con mayor stock si no hay historial de ventas suficiente.
 * Público — no requiere autenticación.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)

  const db = await getDb()

  const productSelect = {
    id: true,
    name: true,
    slug: true,
    price: true,
    image_url: true,
    discount_percent: true,
    stock: true,
  }

  // Sumar unidades vendidas por producto en órdenes pagadas/completadas/aprobadas
  const soldItems = await db.order_items.findMany({
    where: {
      orders: { status: { in: ['paid', 'completed', 'approved'] } },
      product_id: { not: null },
    },
    select: { product_id: true, quantity: true },
  })

  const unitsByProduct: Record<string, number> = {}
  for (const item of soldItems) {
    if (!item.product_id) continue
    unitsByProduct[item.product_id] = (unitsByProduct[item.product_id] ?? 0) + item.quantity
  }

  const topIds = Object.entries(unitsByProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  // Fallback: si no hay suficientes ventas reales, mostrar los de mayor stock con imagen
  if (topIds.length < 4) {
    const featured = await db.products.findMany({
      where: { active: true, stock: { gt: 0 }, image_url: { not: null } },
      orderBy: { stock: 'desc' },
      take: limit,
      select: productSelect,
    })
    return NextResponse.json(
      featured.map((p) => ({ ...p, price: p.price.toString(), units_sold: 0 }))
    )
  }

  const products = await db.products.findMany({
    where: { id: { in: topIds }, active: true, stock: { gt: 0 } },
    select: productSelect,
  })

  const ordered = topIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => ({ ...p!, price: p!.price.toString(), units_sold: unitsByProduct[p!.id] }))

  return NextResponse.json(ordered)
}
