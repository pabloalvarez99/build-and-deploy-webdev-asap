import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

const OVERHEAD_KEYS = [
  'overhead_rent',
  'overhead_golan',
  'overhead_accountant',
  'overhead_salaries',
  'overhead_other',
  'overhead_tax_rate',
  'overhead_sales_target',
  'overhead_margin_alert',
];

export async function GET() {
  try {
    const db = await getDb();

    // Load overhead settings
    const rows = await db.admin_settings.findMany({
      where: { key: { in: OVERHEAD_KEYS } },
    });
    const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));

    const rent = parseFloat(settings.overhead_rent || '0');
    const golan = parseFloat(settings.overhead_golan || '0');
    const accountant = parseFloat(settings.overhead_accountant || '0');
    const salaries = parseFloat(settings.overhead_salaries || '0');
    const other = parseFloat(settings.overhead_other || '0');
    const taxRate = parseFloat(settings.overhead_tax_rate || '19');
    const salesTarget = parseFloat(settings.overhead_sales_target || '1');
    const marginAlert = parseFloat(settings.overhead_margin_alert || '10');

    const overheadTotal = rent + golan + accountant + salaries + other;
    const overheadPct = salesTarget > 0 ? (overheadTotal / salesTarget) * 100 : 0;

    // Load products with cost_price
    const products = await db.products.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        cost_price: true,
        stock: true,
        discount_percent: true,
        categories: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const items = products.map((p) => {
      const price = Number(p.price);
      const cost = p.cost_price !== null ? Number(p.cost_price) : null;
      const discountedPrice = p.discount_percent ? price * (1 - p.discount_percent / 100) : price;
      const priceAfterTax = discountedPrice / (1 + taxRate / 100);
      const overheadPerUnit =
        salesTarget > 0 ? (overheadTotal / salesTarget) * discountedPrice : 0;
      const grossMargin = cost !== null ? priceAfterTax - cost : null;
      const netMargin = grossMargin !== null ? grossMargin - overheadPerUnit : null;
      const netMarginPct =
        netMargin !== null && discountedPrice > 0
          ? (netMargin / discountedPrice) * 100
          : null;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price,
        cost_price: cost,
        discount_percent: p.discount_percent,
        discounted_price: Math.round(discountedPrice),
        stock: p.stock,
        category: p.categories?.name ?? null,
        gross_margin: grossMargin !== null ? Math.round(grossMargin) : null,
        net_margin: netMargin !== null ? Math.round(netMargin) : null,
        net_margin_pct: netMarginPct !== null ? Math.round(netMarginPct * 10) / 10 : null,
        overhead_per_unit: Math.round(overheadPerUnit),
        // semaphore: green>10%, amber 0-10%, red <0%
        status:
          netMarginPct === null
            ? 'no_cost'
            : netMarginPct > 10
            ? 'green'
            : netMarginPct >= 0
            ? 'amber'
            : 'red',
      };
    });

    return NextResponse.json({
      settings: {
        overhead_rent: rent,
        overhead_golan: golan,
        overhead_accountant: accountant,
        overhead_salaries: salaries,
        overhead_other: other,
        overhead_tax_rate: taxRate,
        overhead_sales_target: salesTarget,
        overhead_margin_alert: marginAlert,
      },
      summary: {
        overhead_total: overheadTotal,
        overhead_pct: Math.round(overheadPct * 10) / 10,
        sales_target: salesTarget,
        products_green: items.filter((i) => i.status === 'green').length,
        products_amber: items.filter((i) => i.status === 'amber').length,
        products_red: items.filter((i) => i.status === 'red').length,
        products_no_cost: items.filter((i) => i.status === 'no_cost').length,
      },
      items,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = (await request.json()) as Record<string, number>;
    const db = await getDb();

    const entries = Object.entries(body)
      .filter(([key]) => OVERHEAD_KEYS.includes(key))
      .map(([key, value]) => ({ key, value: String(value) }));

    await Promise.all(
      entries.map(({ key, value }) =>
        db.admin_settings.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
