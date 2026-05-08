import webpush from 'web-push';
import { getDb } from '@/lib/db';

let configured = false;

function configureWebPush() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:contacto@tu-farmacia.cl';
  if (!pub || !priv) throw new Error('VAPID keys missing');
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
}

export type BroadcastPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export type BroadcastResult = {
  ok: boolean;
  sent: number;
  failed: number;
  total: number;
  cleaned: number;
};

export async function sendBroadcast(input: BroadcastPayload): Promise<BroadcastResult> {
  configureWebPush();
  const db = await getDb();
  const subs = await db.push_subscriptions.findMany();
  if (subs.length === 0) return { ok: true, sent: 0, failed: 0, total: 0, cleaned: 0 };

  const payload = JSON.stringify({
    title: input.title,
    body: input.body,
    url: input.url || '/',
    tag: input.tag || 'broadcast',
  });

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

  return { ok: true, sent, failed, total: subs.length, cleaned: stale.length };
}
