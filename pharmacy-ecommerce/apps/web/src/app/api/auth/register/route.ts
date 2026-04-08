import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, surname, phone } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Faltan datos requeridos' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    const displayName = [name, surname].filter(Boolean).join(' ').trim()

    const user = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: true, // auto-confirm, same behaviour as Supabase service role
      phoneNumber: phone ? `+56${phone.replace(/\D/g, '')}` : undefined,
    })

    // Default role is 'user' — no custom claim needed (admin set manually)
    return NextResponse.json({ success: true, user_id: user.uid })
  } catch (err: unknown) {
    const code = (err as { code?: string }).code || ''
    if (code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email. Puedes iniciar sesión.' },
        { status: 409 }
      )
    }
    console.error('[register]', err)
    return NextResponse.json({ error: 'Error interno al crear la cuenta' }, { status: 500 })
  }
}
