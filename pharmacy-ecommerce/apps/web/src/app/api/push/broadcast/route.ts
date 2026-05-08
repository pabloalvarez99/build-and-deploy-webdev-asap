import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { getDb } from '@/lib/db';
import { getAdminUser } from '@/lib/firebase/api-helpers';

export const runtime = 'nodejs';
export const maxDuration = 60;

function configureWebPush() {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:contacto@tu-farmacia.cl';
  if (!pub || !priv) throw new Error('VAPID keys missing');
  webpush.setVapidDetails(subject, pub, priv);
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { title, body, url, tag } = await req.json();
    if (!title || !body) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

    configureWebPush();
    const db = await getDb();
    const subs = await db.push_subscriptions.findMany();
    if (subs.length === 0) return NextResponse.json({ ok: true, sent: 0, total: 0 });

    const payload = JSON.stringify({ title, body, url: url || '/', tag: tag || 'broadcast' });
    let sent = 0;
    let failed = 0;
    const stale: string[] = [];

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
          );
          sent++;
        } catch (e: unknown) {
          const err = e as { statusCode?: number };
          if (err.statusCode === 410 || err.statusCode === 404) stale.push(s.endpoint);
          failed++;
        }
      }),
    );

    if (stale.length > 0) {
      await db.push_subscriptions.deleteMany({ where: { endpoint: { in: stale } } });
    }

    return NextResponse.json({ ok: true, sent, failed, total: subs.length, cleaned: stale.length });
  } catch (e) {
    console.error('[push/broadcast]', e);
    return NextResponse.json({ error: 'broadcast_failed', message: String(e) }, { status: 500 });
  }
}
