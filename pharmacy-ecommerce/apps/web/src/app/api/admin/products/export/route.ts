import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

function esc(val: string | null | undefined): string {
  if (val == null) return '';
  const s = String(val);
  // Wrap in quotes if contains comma, quote, or newline
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = request.nextUrl;
    const db = await getDb();

    // Build where clause — same logic as /api/products
    const where: Record<string, unknown> = {};
    const activeOnly = searchParams.get('active_only') !== 'false';
    if (activeOnly) where.active = true;

    if (searchParams.get('category')) {
      const cat = await db.categories.findFirst({ where: { slug: searchParams.get('category')! }, select: { id: true } });
      if (cat) where.category_id = cat.id;
    }
    if (searchParams.get('laboratory')) where.laboratory = searchParams.get('laboratory');
    if (searchParams.get('prescription_type')) where.prescription_type = searchParams.get('prescription_type');
    if (searchParams.get('search')) {
      const s = searchParams.get('search')!;
      where.OR = [
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
        { laboratory: { contains: s, mode: 'insensitive' } },
      ];
    }
    if (searchParams.get('no_image') === 'true') where.image_url = null;
    if (searchParams.get('has_discount') === 'true') where.discount_percent = { gt: 0 };
    if (searchParams.get('no_external_id') === 'true') where.external_id = null;
    if (searchParams.get('no_barcode') === 'true') where.product_barcodes = { none: {} };

    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    if (minPrice || maxPrice) {
      where.price = {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      };
    }
    const stockFilter = searchParams.get('stock_filter');
    if (stockFilter === 'out') where.stock = 0;
    if (stockFilter === 'low') where.stock = { gt: 0, lte: 10 };
    if (searchParams.get('in_stock') === 'true') where.stock = { gt: 0 };

    const products = await db.products.findMany({
      where,
      include: {
        categories: { select: { name: true } },
        product_barcodes: { select: { barcode: true } },
      },
      orderBy: { name: 'asc' },
      take: 5000, // safety cap
    });

    const headers = [
      'nombre', 'slug', 'categoria', 'precio', 'precio_costo', 'stock',
      'descuento_%', 'laboratorio', 'tipo_receta', 'presentacion',
      'accion_terapeutica', 'principio_activo', 'codigo_externo', 'barcodes',
      'imagen_url', 'activo', 'id',
    ];

    const rows = products.map(p => [
      esc(p.name),
      esc(p.slug),
      esc(p.categories?.name),
      p.price,
      p.cost_price ?? '',
      p.stock,
      p.discount_percent ?? 0,
      esc(p.laboratory),
      esc(p.prescription_type),
      esc(p.presentation),
      esc(p.therapeutic_action),
      esc(p.active_ingredient),
      esc(p.external_id),
      esc(p.product_barcodes.map((b: { barcode: string }) => b.barcode).join(' | ')),
      esc(p.image_url),
      p.active ? '1' : '0',
      p.id,
    ].join(','));

    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    const filename = `productos_${new Date().toISOString().slice(0, 10)}.csv`;
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error('GET /api/admin/products/export error:', e);
    return errorResponse('Error exporting products', 500);
  }
}
