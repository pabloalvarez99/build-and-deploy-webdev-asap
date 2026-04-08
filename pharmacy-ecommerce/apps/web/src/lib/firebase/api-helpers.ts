import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { adminAuth } from './admin'

export type DecodedUser = {
  uid: string
  email?: string
  role?: string
}

export async function getAuthenticatedUser(): Promise<DecodedUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) return null
  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    return { uid: decoded.uid, email: decoded.email, role: decoded.role as string }
  } catch {
    return null
  }
}

export async function getAdminUser(): Promise<DecodedUser | null> {
  const user = await getAuthenticatedUser()
  if (!user || user.role !== 'admin') return null
  return user
}

export function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}
