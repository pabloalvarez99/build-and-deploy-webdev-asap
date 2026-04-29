import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { isOwnerRole } from '@/lib/roles';
import { logAudit } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return errorResponse('Unauthorized', 403);

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get('scope') ?? 'mine'; // mine | all | open
    const status = searchParams.get('status'); // open | done | cancelled

    const db = await getDb();

    type TaskWhere = {
      status?: string;
      OR?: Array<{ assigned_to_uid?: string; assigned_role?: string }>;
    };
    const where: TaskWhere = {};
    if (status) where.status = status;

    if (scope === 'mine') {
      where.OR = [
        { assigned_to_uid: user.uid },
        ...(user.role ? [{ assigned_role: user.role }] : []),
      ];
    } else if (scope === 'open') {
      where.status = 'open';
    } else if (scope !== 'all' || !isOwnerRole(user.role)) {
      where.OR = [
        { assigned_to_uid: user.uid },
        ...(user.role ? [{ assigned_role: user.role }] : []),
      ];
    }

    const tasks = await db.internal_tasks.findMany({
      where,
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { due_date: 'asc' }, { created_at: 'desc' }],
      take: 200,
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAdminUser();
    if (!user) return errorResponse('Unauthorized', 403);

    const body = await req.json();
    const { title, description, assigned_to_uid, assigned_to_name, assigned_role, priority, due_date } = body;

    if (!title || typeof title !== 'string') return errorResponse('title required', 400);
    if (assigned_role && !['owner', 'pharmacist', 'seller'].includes(assigned_role)) {
      return errorResponse('invalid assigned_role', 400);
    }
    if (priority && !['low', 'normal', 'high'].includes(priority)) {
      return errorResponse('invalid priority', 400);
    }

    const db = await getDb();
    const task = await db.internal_tasks.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        assigned_to_uid: assigned_to_uid || null,
        assigned_to_name: assigned_to_name || null,
        assigned_role: assigned_role || null,
        priority: priority || 'normal',
        due_date: due_date ? new Date(due_date) : null,
        status: 'open',
        created_by_uid: user.uid,
        created_by_name: user.name || user.email || null,
      },
    });

    await logAudit(user.email || user.uid, 'create', 'internal_task', task.id, task.title);

    return NextResponse.json({ task });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
