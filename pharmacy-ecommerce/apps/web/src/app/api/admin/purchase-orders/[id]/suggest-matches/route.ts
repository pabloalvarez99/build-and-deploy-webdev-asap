import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

// Token fuzzy match para items unmapped de una OC.
// Misma lógica que scripts/remap-unmapped-items.ts (inter≥2 OR score≥0.60).
// Devuelve hasta 3 sugerencias por item — NUNCA aplica cambios (operador confirma en UI).

const STOPWORDS = new Set([
  'MG', 'ML', 'GR', 'COMP', 'CAPS', 'CAP', 'TAB', 'BE', 'CNP', 'DM', 'RT',
  'COM', 'COMPR', 'COMPRIMIDOS', 'CAPSULAS', 'CAPSULA', 'X', 'POR', 'CON', 'SIN',
  'DE', 'LA', 'EL', 'Y', 'A', 'LP', 'REC', 'ENT', 'JBE', 'SOL', 'CR', 'UNG',
]);

function tokens(s: string): string[] {
  return s
    .toUpperCase()
    .replace(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 4 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

interface Suggestion {
  product_id: string;
  product_name: string;
  product_stock: number;
  score: number;
  inter: number;
  confident: boolean;
  from_mapping?: boolean;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();

    const order = await db.purchase_orders.findUnique({
      where: { id: params.id },
      select: { id: true, supplier_id: true },
    });
    if (!order) return errorResponse('Orden no encontrada', 404);

    const unmapped = await db.purchase_order_items.findMany({
      where: { purchase_order_id: params.id, product_id: null },
      select: {
        id: true,
        product_name_invoice: true,
        supplier_product_code: true,
        quantity: true,
      },
    });

    if (unmapped.length === 0) {
      return NextResponse.json({ suggestions: [], unmapped_count: 0 });
    }

    // Pre-resolver vía supplier_product_mappings: bulk fetch para items con supplier_product_code
    const codes = unmapped
      .map((u) => u.supplier_product_code)
      .filter((c): c is string => !!c);
    const mappings = codes.length > 0
      ? await db.supplier_product_mappings.findMany({
          where: { supplier_id: order.supplier_id, supplier_code: { in: codes } },
          include: { products: { select: { id: true, name: true, stock: true, active: true } } },
        })
      : [];
    const mappingByCode = new Map<string, { id: string; name: string; stock: number }>();
    for (const m of mappings) {
      if (m.products.active) {
        mappingByCode.set(m.supplier_code, { id: m.products.id, name: m.products.name, stock: m.products.stock });
      }
    }

    // Para fuzzy fallback: cargar productos solo si quedan items sin mapping
    const needsFuzzy = unmapped.some((u) => !u.supplier_product_code || !mappingByCode.has(u.supplier_product_code));
    const productTokens: { id: string; name: string; stock: number; toks: string[] }[] = needsFuzzy
      ? (await db.products.findMany({
          where: { active: true },
          select: { id: true, name: true, stock: true },
        })).map((p) => ({ id: p.id, name: p.name, stock: p.stock, toks: tokens(p.name) }))
      : [];

    const result = unmapped.map((item) => {
      // Pre-select desde mapping si existe — skip fuzzy
      if (item.supplier_product_code) {
        const m = mappingByCode.get(item.supplier_product_code);
        if (m) {
          return {
            item_id: item.id,
            product_name_invoice: item.product_name_invoice,
            supplier_product_code: item.supplier_product_code,
            quantity: item.quantity,
            candidates: [{
              product_id: m.id,
              product_name: m.name,
              product_stock: m.stock,
              score: 1,
              inter: 0,
              confident: true,
              from_mapping: true,
            }],
          };
        }
      }

      const invToks = tokens(item.product_name_invoice ?? '');
      const candidates: Suggestion[] = [];

      if (invToks.length > 0) {
        for (const p of productTokens) {
          const inter = invToks.filter((t) => p.toks.includes(t)).length;
          if (inter === 0) continue;
          const score = inter / Math.max(invToks.length, p.toks.length);
          candidates.push({
            product_id: p.id,
            product_name: p.name,
            product_stock: p.stock,
            score,
            inter,
            confident: inter >= 2 || score >= 0.6,
          });
        }
        candidates.sort((a, b) => b.score - a.score || b.inter - a.inter);
      }

      return {
        item_id: item.id,
        product_name_invoice: item.product_name_invoice,
        supplier_product_code: item.supplier_product_code,
        quantity: item.quantity,
        candidates: candidates.slice(0, 3),
      };
    });

    return NextResponse.json({
      suggestions: result,
      unmapped_count: unmapped.length,
    });
  } catch (e) {
    console.error('POST /api/admin/purchase-orders/[id]/suggest-matches error:', e);
    return errorResponse('Error generando sugerencias', 500);
  }
}
