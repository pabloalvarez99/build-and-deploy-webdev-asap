import { NextResponse } from 'next/server'
import { getAuthenticatedUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'

/**
 * GET /api/products/frequent?limit=6
 * Returns the authenticated user's most frequently purchased products (in stock, active).
 * Uses order_items from paid/completed/approved orders.
 */
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return errorResponse('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 12)

    const db = await getDb()

    // Get all order items from this user's completed orders
    const items = await db.order_items.findMany({
      where: {
        orders: {
          user_id: user.uid,
          status: { in: ['paid', 'completed', 'approved', 'delivered', 'processing'] },
        },
        product_id: { not: null },
      },
      select: { product_id: true, quantity: true },
    })

    if (items.length === 0) return NextResponse.json([])

    // Aggregate by product
    const countByProduct: Record<string, number> = {}
    for (const item of items) {
      if (!item.product_id) continue
      countByProduct[item.product_id] = (countByProduct[item.product_id] ?? 0) + item.quantity
    }

    const topIds = Object.entries(countByProduct)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit * 2) // fetch extra in case some are out of stock
      .map(([id]) => id)

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
        laboratory: true,
        presentation: true,
      },
    })

    const ordered = topIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, limit)
      .map((p) => ({ ...p!, price: p!.price.toString(), times_bought: countByProduct[p!.id] }))

    return NextResponse.json(ordered)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}
