import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/firebase/api-helpers';
import { sendBroadcast } from '@/lib/push/broadcast';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

    const { title, body, url, tag } = await req.json();
    if (!title || !body) return NextResponse.json({ error: 'missing_fields' }, { status: 400 });

    const result = await sendBroadcast({ title, body, url, tag });
    return NextResponse.json(result);
  } catch (e) {
    console.error('[push/broadcast]', e);
    return NextResponse.json({ error: 'broadcast_failed', message: String(e) }, { status: 500 });
  }
}
