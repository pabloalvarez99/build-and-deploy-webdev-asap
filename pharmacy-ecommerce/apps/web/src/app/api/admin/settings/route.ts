import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

const EDGE_CONFIG_ID = 'ecfg_a6tzqiy41g9vmi4dtnqx3ddakmpo';
const EDGE_CONFIG_KEYS = ['alert_email', 'low_stock_threshold'];

async function getFromEdgeConfig(): Promise<Record<string, string> | null> {
  if (!process.env.EDGE_CONFIG) return null;
  try {
    const { createClient } = await import('@vercel/edge-config');
    const client = createClient(process.env.EDGE_CONFIG);
    const items = await client.getAll(EDGE_CONFIG_KEYS);
    if (!items) return null;
    const result: Record<string, string> = {};
    for (const key of EDGE_CONFIG_KEYS) {
      if (items[key] !== undefined) result[key] = String(items[key]);
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

async function updateEdgeConfig(entries: Array<{ key: string; value: string }>) {
  const apiToken = process.env.VERCEL_API_TOKEN;
  if (!apiToken) return;
  const relevant = entries.filter((e) => EDGE_CONFIG_KEYS.includes(e.key));
  if (relevant.length === 0) return;
  try {
    await fetch(
      `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: relevant.map(({ key, value }) => ({ operation: 'upsert', key, value })),
        }),
      }
    );
  } catch {
    // Non-critical — DB is source of truth
  }
}

export async function GET() {
  try {
    // Fast path: Edge Config (sub-1ms, no DB round-trip)
    const cached = await getFromEdgeConfig();
    if (cached && Object.keys(cached).length >= EDGE_CONFIG_KEYS.length) {
      return NextResponse.json(cached);
    }

    // Fallback: DB
    const db = await getDb();
    const rows = await db.admin_settings.findMany();
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    // Backfill Edge Config if it was a miss
    if (process.env.EDGE_CONFIG && rows.length > 0) {
      updateEdgeConfig(rows).catch(() => {});
    }

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

    // Update Edge Config in background (non-blocking)
    updateEdgeConfig(entries).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
