import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'

// POST /api/admin/products/bulk-price
// Applies a price adjustment to a set of products.
// Body: { adjustment_type: '%' | '$', adjustment_value: number, direction: 'increase' | 'decrease', category_id?: string, product_ids?: string[], round_to: number }
// round_to: 0 = no round, 10 = nearest 10, 100 = nearest 100, etc.
export async function POST(request: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return errorResponse('Unauthorized', 401)

  const body = await request.json()
  const { adjustment_type, adjustment_value, direction, category_id, product_ids, round_to = 10 } = body as {
    adjustment_type: '%' | '$'
    adjustment_value: number
    direction: 'increase' | 'decrease'
    category_id?: string
    product_ids?: string[]
    round_to?: number
  }

  if (!['%', '$'].includes(adjustment_type)) return errorResponse('adjustment_type inválido', 400)
  if (typeof adjustment_value !== 'number' || adjustment_value <= 0) return errorResponse('adjustment_value debe ser mayor que 0', 400)
  if (!['increase', 'decrease'].includes(direction)) return errorResponse('direction inválido', 400)

  const db = await getDb()

  // Build filter: specific product IDs, category, or all active products
  const where: { id?: { in: string[] }; category_id?: string; active?: boolean } = { active: true }
  if (product_ids && product_ids.length > 0) {
    where.id = { in: product_ids }
  } else if (category_id) {
    where.category_id = category_id
  }

  const products = await db.products.findMany({
    where,
    select: { id: true, price: true, name: true },
  })

  if (products.length === 0) return errorResponse('No hay productos que actualizar', 400)

  // Compute new prices
  const sign = direction === 'increase' ? 1 : -1
  const updated: Array<{ id: string; old_price: number; new_price: number; name: string }> = []

  for (const p of products) {
    const currentPrice = Number(p.price)
    let delta: number
    if (adjustment_type === '%') {
      delta = Math.round(currentPrice * (adjustment_value / 100))
    } else {
      delta = adjustment_value
    }

    let newPrice = currentPrice + sign * delta
    newPrice = Math.max(1, newPrice) // never go below 1 CLP

    // Round to nearest multiple
    if (round_to > 1) {
      newPrice = Math.round(newPrice / round_to) * round_to
    }
    newPrice = Math.round(newPrice)

    if (newPrice !== currentPrice) {
      updated.push({ id: p.id, old_price: currentPrice, new_price: newPrice, name: p.name })
    }
  }

  if (updated.length === 0) {
    return NextResponse.json({ updated: 0, message: 'Ningún precio cambió con estos parámetros' })
  }

  // Apply updates in batches to avoid overwhelming the DB
  const BATCH = 100
  let count = 0
  for (let i = 0; i < updated.length; i += BATCH) {
    const batch = updated.slice(i, i + BATCH)
    await Promise.all(
      batch.map((item) =>
        db.products.update({ where: { id: item.id }, data: { price: item.new_price } })
      )
    )
    count += batch.length
  }

  return NextResponse.json({
    updated: count,
    sample: updated.slice(0, 5).map((u) => ({
      name: u.name,
      old_price: u.old_price,
      new_price: u.new_price,
    })),
  })
}

// GET /api/admin/products/bulk-price?preview=1&...
// Returns preview of what would change without applying
export async function GET(request: NextRequest) {
  const admin = await getAdminUser()
  if (!admin) return errorResponse('Unauthorized', 401)

  const p = request.nextUrl.searchParams
  const adjustment_type = p.get('adjustment_type') as '%' | '$' | null
  const adjustment_value = parseFloat(p.get('adjustment_value') || '0')
  const direction = p.get('direction') as 'increase' | 'decrease' | null
  const category_id = p.get('category_id') || undefined
  const round_to = parseInt(p.get('round_to') || '10')

  if (!adjustment_type || !direction || !adjustment_value) {
    return errorResponse('Parámetros requeridos: adjustment_type, adjustment_value, direction', 400)
  }

  const db = await getDb()
  const where: { category_id?: string; active?: boolean } = { active: true }
  if (category_id) where.category_id = category_id

  const products = await db.products.findMany({
    where,
    select: { id: true, price: true, name: true },
  })

  const sign = direction === 'increase' ? 1 : -1
  let changedCount = 0
  let totalOldValue = 0
  let totalNewValue = 0

  for (const prod of products) {
    const currentPrice = Number(prod.price)
    let delta: number
    if (adjustment_type === '%') {
      delta = Math.round(currentPrice * (adjustment_value / 100))
    } else {
      delta = adjustment_value
    }
    let newPrice = currentPrice + sign * delta
    newPrice = Math.max(1, newPrice)
    if (round_to > 1) newPrice = Math.round(newPrice / round_to) * round_to
    newPrice = Math.round(newPrice)

    totalOldValue += currentPrice
    totalNewValue += newPrice
    if (newPrice !== currentPrice) changedCount++
  }

  return NextResponse.json({
    total_products: products.length,
    will_change: changedCount,
    avg_old_price: products.length > 0 ? Math.round(totalOldValue / products.length) : 0,
    avg_new_price: products.length > 0 ? Math.round(totalNewValue / products.length) : 0,
  })
}
