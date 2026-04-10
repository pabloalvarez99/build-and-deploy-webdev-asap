import { NextResponse } from 'next/server'
import { getAuthenticatedUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return errorResponse('Unauthorized', 401)

  const db = await getDb()
  const profile = await db.profiles.findUnique({
    where: { id: user.uid },
    select: { loyalty_points: true },
  })

  return NextResponse.json({ points: profile?.loyalty_points ?? 0 })
}
