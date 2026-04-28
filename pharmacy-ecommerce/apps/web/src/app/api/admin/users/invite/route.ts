import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';
import { ADMIN_ROLES } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import crypto from 'crypto';

const ALLOWED = [...ADMIN_ROLES, 'user'] as const;

export async function POST(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const role = body.role;
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return errorResponse('Email inválido', 400);
    }
    if (!ALLOWED.includes(role)) return errorResponse('Rol inválido', 400);

    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch {
      const tempPassword = crypto.randomBytes(24).toString('base64url');
      user = await adminAuth.createUser({
        email,
        password: tempPassword,
        displayName: name || undefined,
        emailVerified: false,
        disabled: false,
      });
    }

    await adminAuth.setCustomUserClaims(user.uid, { role });

    let resetLink: string | null = null;
    try {
      resetLink = await adminAuth.generatePasswordResetLink(email);
    } catch (e) {
      console.error('generatePasswordResetLink error:', e);
    }

    logAudit(owner.email || owner.uid, 'create', 'user', user.uid, email, { role: { old: null, new: role } });

    return NextResponse.json({
      user: {
        uid: user.uid,
        email: user.email,
        name: user.displayName || null,
        role,
        created_at: user.metadata.creationTime,
        last_sign_in: user.metadata.lastSignInTime,
        disabled: user.disabled,
      },
      resetLink,
    });
  } catch (error) {
    console.error('Invite user error:', error);
    return errorResponse('Error al invitar usuario', 500);
  }
}
