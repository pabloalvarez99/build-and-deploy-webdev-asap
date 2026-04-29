import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { isOwnerRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAdminUser();
    if (!user) return errorResponse('Unauthorized', 403);

    const body = await req.json();
    const db = await getDb();
    const existing = await db.internal_tasks.findUnique({ where: { id: params.id } });
    if (!existing) return errorResponse('Not found', 404);

    const isMine =
      existing.assigned_to_uid === user.uid ||
      (existing.assigned_role && existing.assigned_role === user.role);
    if (!isOwnerRole(user.role) && !isMine) return errorResponse('Forbidden', 403);

    type TaskUpdate = {
      status?: string;
      completed_at?: Date | null;
      completed_by_uid?: string | null;
      completed_by_name?: string | null;
      title?: string;
      description?: string | null;
      assigned_to_uid?: string | null;
      assigned_to_name?: string | null;
      assigned_role?: string | null;
      priority?: string;
      due_date?: Date | null;
    };
    const data: TaskUpdate = {};

    if (body.action === 'complete') {
      data.status = 'done';
      data.completed_at = new Date();
      data.completed_by_uid = user.uid;
      data.completed_by_name = user.name || user.email || null;
    } else if (body.action === 'reopen') {
      data.status = 'open';
      data.completed_at = null;
      data.completed_by_uid = null;
      data.completed_by_name = null;
    } else if (body.action === 'cancel') {
      if (!isOwnerRole(user.role)) return errorResponse('Owner only', 403);
      data.status = 'cancelled';
    } else if (isOwnerRole(user.role)) {
      // Edit fields (owner only)
      if (typeof body.title === 'string') data.title = body.title.trim();
      if (body.description !== undefined) data.description = body.description?.trim() || null;
      if (body.assigned_to_uid !== undefined) data.assigned_to_uid = body.assigned_to_uid || null;
      if (body.assigned_to_name !== undefined) data.assigned_to_name = body.assigned_to_name || null;
      if (body.assigned_role !== undefined) {
        if (body.assigned_role && !['owner', 'pharmacist', 'seller'].includes(body.assigned_role)) {
          return errorResponse('invalid assigned_role', 400);
        }
        data.assigned_role = body.assigned_role || null;
      }
      if (body.priority !== undefined) {
        if (!['low', 'normal', 'high'].includes(body.priority)) return errorResponse('invalid priority', 400);
        data.priority = body.priority;
      }
      if (body.due_date !== undefined) data.due_date = body.due_date ? new Date(body.due_date) : null;
    } else {
      return errorResponse('Forbidden', 403);
    }

    const task = await db.internal_tasks.update({ where: { id: params.id }, data });
    await logAudit(user.email || user.uid, 'update', 'internal_task', task.id, task.title);

    return NextResponse.json({ task });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAdminUser();
    if (!user || !isOwnerRole(user.role)) return errorResponse('Owner only', 403);

    const db = await getDb();
    const existing = await db.internal_tasks.findUnique({ where: { id: params.id } });
    if (!existing) return errorResponse('Not found', 404);

    await db.internal_tasks.delete({ where: { id: params.id } });
    await logAudit(user.email || user.uid, 'delete', 'internal_task', params.id, existing.title);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
