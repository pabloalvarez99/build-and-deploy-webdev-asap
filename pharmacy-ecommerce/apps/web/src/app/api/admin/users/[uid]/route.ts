import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const { uid } = await params;
  if (!uid) return errorResponse('uid requerido', 400);

  try {
    const body = await request.json();
    const { disabled } = body as { disabled?: boolean };

    if (uid === owner.uid && disabled === true) {
      return errorResponse('No puedes deshabilitar tu propio acceso', 400);
    }

    const update: { disabled?: boolean } = {};
    if (typeof disabled === 'boolean') update.disabled = disabled;
    if (Object.keys(update).length === 0) return errorResponse('Sin cambios', 400);

    const user = await adminAuth.updateUser(uid, update);
    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email,
        name: user.displayName || null,
        role: (user.customClaims?.role as string) || 'user',
        created_at: user.metadata.creationTime,
        last_sign_in: user.metadata.lastSignInTime,
        disabled: user.disabled,
      },
    });
  } catch (error) {
    console.error('Patch user error:', error);
    return errorResponse('Error al actualizar usuario', 500);
  }
}
