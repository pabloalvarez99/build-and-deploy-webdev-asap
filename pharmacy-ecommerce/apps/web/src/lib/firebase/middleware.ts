import { NextRequest, NextResponse } from 'next/server'

// Decode JWT payload without signature verification.
// Used only for redirect decisions — actual auth is enforced in API routes via firebase-admin.
// Safe in Edge Runtime: uses atob() instead of Node.js Buffer.
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // Base64url → Base64 + padding
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const sessionCookie = request.cookies.get('session')?.value

  // Admin routes: check cookie exists and has admin role in payload.
  // Full cryptographic verification happens in every API route via getAdminUser().
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/auth/login?redirect=/admin', request.url))
    }
    const payload = decodeJwtPayload(sessionCookie)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Private routes: just require cookie presence.
  if (request.nextUrl.pathname.startsWith('/mis-pedidos')) {
    if (!sessionCookie) {
      return NextResponse.redirect(
        new URL(`/auth/login?redirect=${request.nextUrl.pathname}`, request.url)
      )
    }
  }

  return NextResponse.next()
}
