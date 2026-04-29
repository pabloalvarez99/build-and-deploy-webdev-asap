import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { isOwnerRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAdminUser();
    if (!user || !isOwnerRole(user.role)) return errorResponse('Owner only', 403);

    const body = await req.json();
    const db = await getDb();
    const existing = await db.announcements.findUnique({ where: { id: params.id } });
    if (!existing) return errorResponse('Not found', 404);

    type AnnUpdate = {
      title?: string;
      body?: string;
      severity?: string;
      visible_to?: string;
      pinned?: boolean;
      expires_at?: Date | null;
    };
    const data: AnnUpdate = {};
    if (typeof body.title === 'string') data.title = body.title.trim();
    if (typeof body.body === 'string') data.body = body.body.trim();
    if (body.severity !== undefined) {
      if (!['info', 'warning', 'critical'].includes(body.severity)) return errorResponse('invalid severity', 400);
      data.severity = body.severity;
    }
    if (body.visible_to !== undefined) {
      if (!['all', 'owner', 'pharmacist', 'seller'].includes(body.visible_to)) return errorResponse('invalid visible_to', 400);
      data.visible_to = body.visible_to;
    }
    if (body.pinned !== undefined) data.pinned = !!body.pinned;
    if (body.expires_at !== undefined) data.expires_at = body.expires_at ? new Date(body.expires_at) : null;

    const ann = await db.announcements.update({ where: { id: params.id }, data });
    await logAudit(user.email || user.uid, 'update', 'announcement', ann.id, ann.title);
    return NextResponse.json({ announcement: ann });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAdminUser();
    if (!user || !isOwnerRole(user.role)) return errorResponse('Owner only', 403);

    const db = await getDb();
    const existing = await db.announcements.findUnique({ where: { id: params.id } });
    if (!existing) return errorResponse('Not found', 404);

    await db.announcements.delete({ where: { id: params.id } });
    await logAudit(user.email || user.uid, 'delete', 'announcement', params.id, existing.title);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
