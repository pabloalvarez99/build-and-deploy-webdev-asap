import { cookies, headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminAuth } from './admin'
import { isAdminRole, isOwnerRole } from '@/lib/roles'

export type DecodedUser = {
  uid: string
  email?: string
  name?: string
  role?: string
}

function toDecodedUser(decoded: {
  uid: string
  email?: string
  name?: string
  role?: string
}): DecodedUser {
  return {
    uid: decoded.uid,
    email: decoded.email,
    name: decoded.name as string | undefined,
    role: decoded.role as string | undefined,
  }
}

/**
 * Auth for web (session cookie) and native mobile (Bearer Firebase ID token).
 * Prefer Bearer when present so Android/iOS clients do not need cookies.
 */
export async function getAuthenticatedUser(): Promise<DecodedUser | null> {
  const headerStore = await headers()
  const authHeader = headerStore.get('authorization')
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const idToken = authHeader.slice(7).trim()
    if (!idToken) return null
    try {
      const decoded = await adminAuth.verifyIdToken(idToken, true)
      return toDecodedUser(decoded as { uid: string; email?: string; name?: string; role?: string })
    } catch {
      return null
    }
  }

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return null
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    return toDecodedUser(decoded as { uid: string; email?: string; name?: string; role?: string })
  } catch {
    return null
  }
}

/** Any admin role: owner, pharmacist, seller (or legacy 'admin') */
export async function getAdminUser(): Promise<DecodedUser | null> {
  const user = await getAuthenticatedUser()
  if (!user || !isAdminRole(user.role)) return null
  return user
}

/** Only owner (or legacy 'admin') */
export async function getOwnerUser(): Promise<DecodedUser | null> {
  const user = await getAuthenticatedUser()
  if (!user || !isOwnerRole(user.role)) return null
  return user
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
