import { NextResponse } from 'next/server'
import { getAuthenticatedUser, errorResponse } from '@/lib/firebase/api-helpers'
import { isAdminRole } from '@/lib/roles'

/** GET /api/auth/me — current user from session cookie or Bearer ID token (mobile). */
export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return errorResponse('Unauthorized', 401)

    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email ?? null,
        name: user.name ?? null,
        role: user.role ?? 'user',
        is_admin: isAdminRole(user.role),
      },
    })
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500)
  }
}
