import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

/**
 * GET /api/products/top-sellers?limit=10
 * Retorna los N productos más repuestos vía importación de Excel (stock_movements reason='import_excel').
 * Solo cuenta deltas positivos (reposiciones). Fallback: productos con mayor descuento si no hay historial.
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

  // Sumar unidades importadas por producto (solo deltas positivos = reposiciones)
  const movements = await db.stock_movements.findMany({
    where: { reason: 'import_excel', delta: { gt: 0 } },
    select: { product_id: true, delta: true },
  })

  const unitsByProduct: Record<string, number> = {}
  for (const m of movements) {
    if (!m.product_id) continue
    unitsByProduct[m.product_id] = (unitsByProduct[m.product_id] ?? 0) + m.delta
  }

  const topIds = Object.entries(unitsByProduct)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)

  // Fallback: si no hay suficiente historial de imports, mostrar productos con descuento activo
  if (topIds.length < 4) {
    const featured = await db.products.findMany({
      where: { active: true, stock: { gt: 0 }, discount_percent: { gt: 0 } },
      orderBy: { discount_percent: 'desc' },
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
