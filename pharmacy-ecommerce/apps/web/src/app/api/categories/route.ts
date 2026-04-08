import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/categories?active_only=true
export async function GET(request: NextRequest) {
  const activeOnly = request.nextUrl.searchParams.get('active_only') !== 'false'
  const db = await getDb()

  const categories = await db.categories.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(
    categories.map((c) => ({
      id: c.id, name: c.name, slug: c.slug,
      description: c.description, image_url: c.image_url, active: c.active,
    }))
  )
}
