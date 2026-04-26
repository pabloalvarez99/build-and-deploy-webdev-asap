import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, errorResponse } from '@/lib/firebase/api-helpers'
import { getDb } from '@/lib/db'

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return errorResponse('Unauthorized', 401)

    const body = await request.json()
    const { phone } = body as { phone?: string }

    if (phone !== undefined && typeof phone !== 'string') {
      return errorResponse('phone must be a string', 400)
    }

    const db = await getDb()

    const profile = await db.profiles.upsert({
      where: { id: user.uid },
      update: { phone: phone ?? null },
      create: { id: user.uid, phone: phone ?? null },
      select: { id: true, phone: true, loyalty_points: true },
    })

    return NextResponse.json({ profile })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}
