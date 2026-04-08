import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/categories/[id]/count — product count for a category
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = await getDb()
  const count = await db.products.count({ where: { category_id: params.id } })
  return NextResponse.json({ count })
}
