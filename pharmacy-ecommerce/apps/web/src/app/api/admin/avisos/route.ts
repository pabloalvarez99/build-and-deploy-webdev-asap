import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { isOwnerRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';

function visibleFor(role?: string): string[] {
  const list = ['all'];
  if (isOwnerRole(role)) list.push('owner');
  if (role === 'pharmacist') list.push('pharmacist');
  if (role === 'seller') list.push('seller');
  return list;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return errorResponse('Unauthorized', 403);

    const { searchParams } = new URL(req.url);
    const all = searchParams.get('scope') === 'all' && isOwnerRole(user.role);

    const db = await getDb();
    const now = new Date();

    type AnnWhere = {
      visible_to?: { in: string[] };
      OR?: Array<{ expires_at: null } | { expires_at: { gt: Date } }>;
    };
    const where: AnnWhere = all ? {} : {
      visible_to: { in: visibleFor(user.role) },
      OR: [{ expires_at: null }, { expires_at: { gt: now } }],
    };

    const announcements = await db.announcements.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { created_at: 'desc' }],
      take: 100,
    });

    return NextResponse.json({ announcements });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user || !isOwnerRole(user.role)) return errorResponse('Owner only', 403);

    const body = await req.json();
    const { title, body: text, severity, visible_to, pinned, expires_at } = body;

    if (!title || typeof title !== 'string') return errorResponse('title required', 400);
    if (!text || typeof text !== 'string') return errorResponse('body required', 400);
    if (severity && !['info', 'warning', 'critical'].includes(severity)) return errorResponse('invalid severity', 400);
    if (visible_to && !['all', 'owner', 'pharmacist', 'seller'].includes(visible_to)) return errorResponse('invalid visible_to', 400);

    const db = await getDb();
    const ann = await db.announcements.create({
      data: {
        title: title.trim(),
        body: text.trim(),
        severity: severity || 'info',
        visible_to: visible_to || 'all',
        pinned: !!pinned,
        expires_at: expires_at ? new Date(expires_at) : null,
        created_by_uid: user.uid,
        created_by_name: user.name || user.email || null,
      },
    });

    await logAudit(user.email || user.uid, 'create', 'announcement', ann.id, ann.title);
    return NextResponse.json({ announcement: ann });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
