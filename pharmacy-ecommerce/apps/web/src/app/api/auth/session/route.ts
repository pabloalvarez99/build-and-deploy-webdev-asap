import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/lib/firebase/admin'

// POST /api/auth/session — creates server-side session cookie after Firebase login
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (!idToken) return NextResponse.json({ error: 'idToken requerido' }, { status: 400 })

    const expiresIn = 60 * 60 * 24 * 14 * 1000 // 14 días en ms
    const [sessionCookie, decoded] = await Promise.all([
      adminAuth.createSessionCookie(idToken, { expiresIn }),
      adminAuth.verifyIdToken(idToken),
    ])

    const cookieStore = await cookies()
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({ role: (decoded.role as string) || 'user' })
  } catch (err: any) {
    console.error('[session POST] code:', err?.code, 'msg:', err?.message, 'cause:', err?.cause?.message)
    return NextResponse.json({ error: 'Token inválido', code: err?.code, detail: err?.message }, { status: 401 })
  }
}

// DELETE /api/auth/session — clears session cookie on logout
export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  return NextResponse.json({ success: true })
}
