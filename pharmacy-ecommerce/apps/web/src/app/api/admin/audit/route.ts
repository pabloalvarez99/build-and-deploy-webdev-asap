import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const owner = await getOwnerUser();
    if (!owner) return errorResponse('Unauthorized', 403);

    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity') || undefined;
    const action = searchParams.get('action') || undefined;
    const user = searchParams.get('user') || undefined;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get('pageSize') || '50')));

    const where: Record<string, unknown> = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;
    if (user) where.user_email = { contains: user, mode: 'insensitive' };
    if (from || to) {
      where.created_at = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      };
    }

    const db = await getDb();
    const [rows, total] = await Promise.all([
      db.audit_log.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      db.audit_log.count({ where }),
    ]);

    return NextResponse.json({
      rows: rows.map((r) => ({
        ...r,
        created_at: r.created_at.toISOString(),
      })),
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
