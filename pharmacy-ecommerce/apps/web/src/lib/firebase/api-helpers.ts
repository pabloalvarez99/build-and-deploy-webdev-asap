import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminAuth } from './admin'
import { isAdminRole, isOwnerRole } from '@/lib/roles'

export type DecodedUser = {
  uid: string
  email?: string
  name?: string
  role?: string
}

export async function getAuthenticatedUser(): Promise<DecodedUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return null
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    return {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name as string | undefined,
      role: decoded.role as string | undefined,
    }
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
