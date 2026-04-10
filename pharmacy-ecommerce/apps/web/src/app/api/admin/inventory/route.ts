import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();

    const products = await db.products.findMany({
      where: { active: true, stock: { gt: 0 } },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true,
        cost_price: true,
        categories: { select: { name: true } },
      },
      orderBy: { stock: 'desc' },
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

      return {
        id: p.id,
        name: p.name,
        stock: p.stock,
        price: price,
        cost_price: cost,
        retail_value: retailValue,
        cost_value: costValue,
        margin_pct: cost != null && price > 0 ? ((price - cost) / price) * 100 : null,
        category: p.categories?.name ?? 'Sin categoría',
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
      },
      items,
    });
  } catch (error) {
    console.error('Inventory error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
