import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { getDb } from '@/lib/db';

/**
 * GET /api/admin/turnos?page=1&limit=20&from=YYYY-MM-DD&to=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const format = searchParams.get('format');

    const db = await getDb();

    const where: Record<string, unknown> = {};
    if (from || to) {
      where.turno_fin = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + 'T23:59:59Z') } : {}),
      };
    }

    if (format === 'csv') {
      const all = await db.caja_cierres.findMany({
        where,
        orderBy: { turno_fin: 'desc' },
        take: 1000,
      });
      const header = 'Fecha cierre,Inicio turno,Cerrado por,Ventas total,Efectivo,Débito,Crédito,Transacciones,Efectivo esperado,Efectivo contado,Diferencia,Notas';
      const rows = all.map(c => [
        new Date(c.turno_fin).toLocaleString('es-CL'),
        new Date(c.turno_inicio).toLocaleString('es-CL'),
        c.cerrado_por ?? '',
        Number(c.ventas_total),
        Number(c.ventas_efectivo),
        Number(c.ventas_debito),
        Number(c.ventas_credito),
        c.num_transacciones,
        Number(c.efectivo_esperado),
        Number(c.efectivo_contado),
        Number(c.diferencia),
        (c.notas ?? '').replace(/,/g, ';'),
      ].join(','));
      const csv = [header, ...rows].join('\n');
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="turnos-caja-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    const [total, items] = await Promise.all([
      db.caja_cierres.count({ where }),
      db.caja_cierres.findMany({
        where,
        orderBy: { turno_fin: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      items: items.map(c => ({
        id: c.id,
        turno_inicio: c.turno_inicio,
        turno_fin: c.turno_fin,
        fondo_inicial: Number(c.fondo_inicial),
        ventas_efectivo: Number(c.ventas_efectivo),
        ventas_debito: Number(c.ventas_debito),
        ventas_credito: Number(c.ventas_credito),
        ventas_total: Number(c.ventas_total),
        num_transacciones: c.num_transacciones,
        efectivo_esperado: Number(c.efectivo_esperado),
        efectivo_contado: Number(c.efectivo_contado),
        diferencia: Number(c.diferencia),
        notas: c.notas,
        cerrado_por: c.cerrado_por,
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error('turnos GET error:', e);
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
}
