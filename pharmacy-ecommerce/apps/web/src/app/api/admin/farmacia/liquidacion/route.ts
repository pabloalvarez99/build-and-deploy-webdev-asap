import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { logAudit } from '@/lib/audit';

function suggestDiscount(daysToExpiry: number): number {
  if (daysToExpiry <= 0) return 50;
  if (daysToExpiry <= 15) return 40;
  if (daysToExpiry <= 30) return 25;
  if (daysToExpiry <= 60) return 10;
  return 0;
}

function tier(daysToExpiry: number): 'expired' | 'critical' | 'urgent' | 'warning' {
  if (daysToExpiry <= 0) return 'expired';
  if (daysToExpiry <= 15) return 'critical';
  if (daysToExpiry <= 30) return 'urgent';
  return 'warning';
}

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();
    const now = new Date();
    const cutoff = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    const batches = await db.product_batches.findMany({
      where: { expiry_date: { lte: cutoff }, quantity: { gt: 0 } },
      include: {
        products: {
          select: { id: true, name: true, slug: true, price: true, stock: true, discount_percent: true, image_url: true, categories: { select: { name: true } } },
        },
      },
      orderBy: { expiry_date: 'asc' },
    });

    const grouped: Record<string, {
      product_id: string;
      product_name: string;
      product_slug: string;
      price: number;
      stock: number;
      current_discount: number;
      image_url: string | null;
      category: string | null;
      total_at_risk: number;
      min_expiry: string;
      days_to_expiry: number;
      suggested_discount: number;
      tier: ReturnType<typeof tier>;
      batches: Array<{ id: string; batch_code: string | null; expiry_date: string; quantity: number }>;
    }> = {};

    for (const b of batches) {
      const pid = b.product_id;
      const expiry = b.expiry_date;
      const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (!grouped[pid]) {
        grouped[pid] = {
          product_id: pid,
          product_name: b.products.name,
          product_slug: b.products.slug,
          price: Number(b.products.price),
          stock: b.products.stock,
          current_discount: b.products.discount_percent ?? 0,
          image_url: b.products.image_url,
          category: b.products.categories?.name ?? null,
          total_at_risk: 0,
          min_expiry: expiry.toISOString(),
          days_to_expiry: days,
          suggested_discount: suggestDiscount(days),
          tier: tier(days),
          batches: [],
        };
      }
      const g = grouped[pid];
      g.total_at_risk += b.quantity;
      g.batches.push({
        id: b.id,
        batch_code: b.batch_code,
        expiry_date: expiry.toISOString(),
        quantity: b.quantity,
      });
      if (expiry.getTime() < new Date(g.min_expiry).getTime()) {
        g.min_expiry = expiry.toISOString();
        g.days_to_expiry = days;
        g.suggested_discount = suggestDiscount(days);
        g.tier = tier(days);
      }
    }

    const items = Object.values(grouped).sort((a, b) => a.days_to_expiry - b.days_to_expiry);

    const summary = {
      total_products: items.length,
      total_units: items.reduce((s, i) => s + i.total_at_risk, 0),
      potential_loss: items.reduce((s, i) => s + i.price * i.total_at_risk, 0),
      expired: items.filter((i) => i.tier === 'expired').length,
      critical: items.filter((i) => i.tier === 'critical').length,
      urgent: items.filter((i) => i.tier === 'urgent').length,
      warning: items.filter((i) => i.tier === 'warning').length,
    };

    return NextResponse.json({ items, summary });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await req.json() as { items: Array<{ product_id: string; discount_percent: number }> };
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return errorResponse('items required', 400);
    }

    const db = await getDb();
    const updated: Array<{ id: string; name: string; discount_percent: number }> = [];

    for (const it of body.items) {
      if (typeof it.discount_percent !== 'number' || it.discount_percent < 0 || it.discount_percent > 99) continue;
      const before = await db.products.findUnique({ where: { id: it.product_id }, select: { name: true, discount_percent: true } });
      if (!before) continue;
      await db.products.update({
        where: { id: it.product_id },
        data: { discount_percent: it.discount_percent || null },
      });
      updated.push({ id: it.product_id, name: before.name, discount_percent: it.discount_percent });
      await logAudit(admin.email || admin.uid, 'update', 'product', it.product_id, before.name, {
        discount_percent: { old: before.discount_percent, new: it.discount_percent },
        reason: { old: null, new: 'liquidation_expiry' },
      });
    }

    revalidateTag('products');

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
