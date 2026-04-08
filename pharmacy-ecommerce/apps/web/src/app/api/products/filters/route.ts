import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/products/filters?type=laboratories|therapeutic_actions|active_ingredients
export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type')
  const db = await getDb()

  if (type === 'laboratories') {
    const rows = await db.products.findMany({
      where: { laboratory: { not: null }, active: true },
      distinct: ['laboratory'],
      select: { laboratory: true },
      orderBy: { laboratory: 'asc' },
    })
    return NextResponse.json({ laboratories: rows.map((r) => r.laboratory).filter(Boolean) })
  }

  if (type === 'therapeutic_actions') {
    const rows = await db.products.findMany({
      where: { therapeutic_action: { not: null }, active: true },
      distinct: ['therapeutic_action'],
      select: { therapeutic_action: true },
      orderBy: { therapeutic_action: 'asc' },
    })
    return NextResponse.json({ therapeutic_actions: rows.map((r) => r.therapeutic_action).filter(Boolean) })
  }

  if (type === 'active_ingredients') {
    const rows = await db.products.findMany({
      where: { active_ingredient: { not: null }, active: true },
      distinct: ['active_ingredient'],
      select: { active_ingredient: true },
      orderBy: { active_ingredient: 'asc' },
    })
    return NextResponse.json({ active_ingredients: rows.map((r) => r.active_ingredient).filter(Boolean) })
  }

  return NextResponse.json({ error: 'type param required' }, { status: 400 })
}
