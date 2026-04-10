import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();
    const { searchParams } = request.nextUrl;
    const filter = searchParams.get('filter'); // 'low' | 'out' | null (all)
    const search = searchParams.get('search') || '';

    // Fetch settings for low stock threshold
    const settings = await db.admin_settings.findMany({ select: { key: true, value: true } });
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const threshold = parseInt(settingsMap.low_stock_threshold || '10');

    const where: Record<string, unknown> = { active: true };
    if (filter === 'low') {
      where.stock = { gt: 0, lte: threshold };
    } else if (filter === 'out') {
      where.stock = 0;
    }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const products = await db.products.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        stock: true,
        price: true,
        cost_price: true,
        categories: { select: { name: true } },
        supplier_product_mappings: {
          take: 1,
          select: {
            supplier_code: true,
            suppliers: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { stock: 'asc' },
    });

    let totalRetailValue = 0;
    let totalCostValue = 0;
    let productsWithCost = 0;

    const items = products.map((p) => {
      const price = Number(p.price);
      const cost = p.cost_price != null ? Number(p.cost_price) : null;
      const retailValue = price * p.stock;
      const costValue = cost != null ? cost * p.stock : null;

      totalRetailValue += retailValue;
      if (costValue != null) {
        totalCostValue += costValue;
        productsWithCost++;
      }

      const mapping = p.supplier_product_mappings[0];

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        stock: p.stock,
        price,
        cost_price: cost,
        retail_value: retailValue,
        cost_value: costValue,
        margin_pct: cost != null && price > 0 ? ((price - cost) / price) * 100 : null,
        category: p.categories?.name ?? 'Sin categoría',
        low_stock: p.stock <= threshold,
        supplier: mapping?.suppliers
          ? { id: mapping.suppliers.id, name: mapping.suppliers.name, code: mapping.supplier_code }
          : null,
      };
    });

    const grossMarginValue = totalRetailValue - totalCostValue;
    const marginPct = totalRetailValue > 0 ? (grossMarginValue / totalRetailValue) * 100 : 0;

    return NextResponse.json({
      summary: {
        total_products: products.length,
        products_with_cost: productsWithCost,
        total_retail_value: totalRetailValue,
        total_cost_value: totalCostValue,
        gross_margin_value: grossMarginValue,
        margin_pct: marginPct,
        low_stock_threshold: threshold,
      },
      items,
    });
  } catch (error) {
    console.error('Inventory error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
