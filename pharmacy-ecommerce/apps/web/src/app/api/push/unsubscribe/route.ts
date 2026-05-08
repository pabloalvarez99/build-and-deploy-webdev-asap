import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { endpoint } = await req.json();
    if (!endpoint) return NextResponse.json({ error: 'missing_endpoint' }, { status: 400 });
    const db = await getDb();
    await db.push_subscriptions.deleteMany({ where: { endpoint } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[push/unsubscribe]', e);
    return NextResponse.json({ error: 'unsubscribe_failed' }, { status: 500 });
  }
}
