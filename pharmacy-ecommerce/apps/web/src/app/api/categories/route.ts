import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/db'

const fetchCategories = unstable_cache(
  async (activeOnly: boolean) => {
    const db = await getDb()
    const categories = await db.categories.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { name: 'asc' },
    })
    return categories.map((c) => ({
      id: c.id, name: c.name, slug: c.slug,
      description: c.description, image_url: c.image_url, active: c.active,
    }))
  },
  ['categories-list'],
  { tags: ['categories'], revalidate: 3600 }
)

// GET /api/categories?active_only=true
export async function GET(request: NextRequest) {
  const activeOnly = request.nextUrl.searchParams.get('active_only') !== 'false'
  const data = await fetchCategories(activeOnly)
  return NextResponse.json(data)
}
