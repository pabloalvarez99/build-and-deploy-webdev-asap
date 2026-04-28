import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';
import { ADMIN_ROLES } from '@/lib/roles';

export async function GET() {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  try {
    const listResult = await adminAuth.listUsers(1000);
    const users = listResult.users.map((u) => ({
      uid: u.uid,
      email: u.email,
      name: u.displayName || null,
      role: (u.customClaims?.role as string) || 'user',
      created_at: u.metadata.creationTime,
      last_sign_in: u.metadata.lastSignInTime,
      disabled: u.disabled,
    }));
    return NextResponse.json({ users });
  } catch (error) {
    console.error('List users error:', error);
    return errorResponse('Error al listar usuarios', 500);
  }
}

export async function POST(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  try {
    const { uid, role } = await request.json();
    if (!uid || typeof uid !== 'string') return errorResponse('uid requerido', 400);

    const validRoles = [...ADMIN_ROLES, 'user'];
    if (!validRoles.includes(role)) return errorResponse('Rol inválido', 400);

    if (uid === owner.uid && role === 'user') {
      return errorResponse('No puedes remover tu propio acceso admin', 400);
    }

    await adminAuth.setCustomUserClaims(uid, { role });
    return NextResponse.json({ success: true, uid, role });
  } catch (error) {
    console.error('Set role error:', error);
    return errorResponse('Error al actualizar rol', 500);
  }
}
