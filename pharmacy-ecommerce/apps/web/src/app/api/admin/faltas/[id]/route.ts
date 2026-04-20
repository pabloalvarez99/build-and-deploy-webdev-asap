import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const body = await request.json() as { status?: string; notes?: string };

    const db = await getDb();
    const data: Record<string, unknown> = {};
    if (body.status) {
      data.status = body.status;
      if (body.status === 'notified') data.notified_at = new Date();
    }
    if (body.notes !== undefined) data.notes = body.notes;

    const updated = await db.faltas.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const db = await getDb();
    await db.faltas.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
