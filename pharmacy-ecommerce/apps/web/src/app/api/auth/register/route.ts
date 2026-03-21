import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, surname, phone } = await request.json();

    if (!email || !password || !name || !surname) {
      return errorResponse('Faltan datos requeridos');
    }

    if (password.length < 6) {
      return errorResponse('La contraseña debe tener al menos 6 caracteres');
    }

    const supabase = getServiceClient();

    // Create user with service role (auto-confirms email)
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, surname, phone: phone || null },
    });

    if (createError) {
      if (createError.message?.toLowerCase().includes('already')) {
        return errorResponse('Ya existe una cuenta con este email. Puedes iniciar sesión.');
      }
      return errorResponse(createError.message || 'Error al crear la cuenta');
    }

    if (!userData.user) {
      return errorResponse('Error al crear la cuenta');
    }

    // Try to update profile with name fields (if columns exist)
    await supabase
      .from('profiles')
      .update({ full_name: `${name} ${surname}`.trim() })
      .eq('id', userData.user.id)
      .then(() => {}); // ignore errors - column may not exist

    return NextResponse.json({ success: true, user_id: userData.user.id });
  } catch {
    return errorResponse('Error interno al crear la cuenta', 500);
  }
}
