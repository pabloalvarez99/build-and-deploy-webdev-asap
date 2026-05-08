import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/firebase/api-helpers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { endpoint, keys } = body;
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'invalid_subscription' }, { status: 400 });
    }
    const user = await getAuthenticatedUser();
    const db = await getDb();
    const userAgent = req.headers.get('user-agent') || null;

    await db.push_subscriptions.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_id: user?.uid || null,
        user_agent: userAgent,
        last_used_at: new Date(),
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_id: user?.uid || null,
        user_agent: userAgent,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[push/subscribe]', e);
    return NextResponse.json({ error: 'subscribe_failed' }, { status: 500 });
  }
}
