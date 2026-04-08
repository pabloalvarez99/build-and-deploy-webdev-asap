import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from './admin'

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const sessionCookie = request.cookies.get('session')?.value

  // Admin routes: require valid session + admin role
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/auth/login?redirect=/admin', request.url))
    }
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
      if (decoded.role !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/auth/login?redirect=/admin', request.url))
    }
  }

  // Private routes: require valid session only
  if (request.nextUrl.pathname.startsWith('/mis-pedidos')) {
    if (!sessionCookie) {
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${request.nextUrl.pathname}`, request.url)
      )
    }
    try {
      await adminAuth.verifySessionCookie(sessionCookie, true)
    } catch {
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${request.nextUrl.pathname}`, request.url)
      )
    }
  }

  return NextResponse.next()
}
