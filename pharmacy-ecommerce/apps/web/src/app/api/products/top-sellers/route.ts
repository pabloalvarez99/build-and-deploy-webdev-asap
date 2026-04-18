import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * GET /api/products/top-sellers?limit=10
 * Retorna los N productos más vendidos combinando:
 * 1. order_items de órdenes pagadas/completadas/aprobadas (ventas reales del sistema)
 * 2. stock_movements reason='ventas_historicas' (diferencia de stock ene-8 → ene-19)
 * Fallback: productos con mayor stock e imagen si no hay suficiente historial.
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

  const unitsByProduct: Record<string, number> = {}

  // 1. Ventas reales: order_items de órdenes completadas
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

  // 2. Historial: stock_movements reason='ventas_historicas' (delta < 0 = unidades vendidas)
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

  // Fallback: productos con mayor stock e imagen
  if (topIds.length < 4) {
    const featured = await db.products.findMany({
      where: { active: true, stock: { gt: 0 }, image_url: { not: null }, price: { gte: 1000 } },
      orderBy: { stock: 'desc' },
      take: limit,
      select: productSelect,
    })
    return NextResponse.json(
      featured.map((p) => ({ ...p, price: p.price.toString(), units_sold: 0 }))
    )
  }

  const products = await db.products.findMany({
    where: { id: { in: topIds }, active: true, stock: { gt: 0 }, price: { gte: 1000 } },
    select: productSelect,
  })

  const ordered = topIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => ({ ...p!, price: p!.price.toString(), units_sold: unitsByProduct[p!.id] }))

  return NextResponse.json(ordered)
}
