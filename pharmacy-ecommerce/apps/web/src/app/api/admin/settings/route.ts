import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.admin_settings.findMany();
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return NextResponse.json(settings);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json() as Record<string, string>;
    const db = await getDb();

    // Accept either { key: value } object or [{ key, value }] array
    const entries: Array<{ key: string; value: string }> = Array.isArray(body)
      ? body
      : Object.entries(body).map(([key, value]) => ({ key, value: String(value) }));

    await Promise.all(
      entries.map(({ key, value }) =>
        db.admin_settings.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
