import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [
      recetasHoy,
      recetasMes,
      controladasHoy,
      ultimasRecetas,
      lotesPorVencer,
      sinReceta,
      turnoActivo,
      stockSinAlternativa,
    ] = await Promise.all([
      db.prescription_records.count({ where: { dispensed_at: { gte: todayStart } } }),
      db.prescription_records.count({ where: { dispensed_at: { gte: monthStart } } }),
      db.prescription_records.count({ where: { dispensed_at: { gte: todayStart }, is_controlled: true } }),
      db.prescription_records.findMany({
        select: {
          id: true,
          patient_name: true,
          patient_rut: true,
          doctor_name: true,
          product_name: true,
          quantity: true,
          is_controlled: true,
          dispensed_at: true,
          dispensed_by: true,
        },
        orderBy: { dispensed_at: 'desc' },
        take: 10,
      }),
      db.product_batches.findMany({
        where: { expiry_date: { gte: now, lte: in30d }, quantity: { gt: 0 } },
        select: {
          id: true,
          batch_code: true,
          expiry_date: true,
          quantity: true,
          products: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { expiry_date: 'asc' },
        take: 5,
      }),
      db.orders.count({
        where: {
          created_at: { gte: todayStart },
          payment_provider: { in: ['pos_cash', 'pos_debit', 'pos_credit', 'pos_mixed'] },
          order_items: { some: { products: { prescription_type: { in: ['required', 'controlled'] } } } },
          prescription_records: { none: {} },
        },
      }),
      db.pharmacist_shifts.findFirst({
        where: { shift_end: null },
        orderBy: { shift_start: 'desc' },
      }),
      db.products.count({
        where: {
          active: true,
          stock: 0,
          prescription_type: { in: ['required', 'controlled'] },
        },
      }),
    ]);

    return NextResponse.json({
      kpis: {
        recetas_hoy: recetasHoy,
        recetas_mes: recetasMes,
        controladas_hoy: controladasHoy,
        sin_registro_receta: sinReceta,
        controlados_sin_stock: stockSinAlternativa,
      },
      lotes_por_vencer: lotesPorVencer.map((b) => ({
        id: b.id,
        producto: b.products.name,
        slug: b.products.slug,
        batch_code: b.batch_code,
        expiry_date: b.expiry_date,
        quantity: b.quantity,
        dias_restantes: Math.ceil((new Date(b.expiry_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      })),
      ultimas_recetas: ultimasRecetas,
      turno_activo: turnoActivo
        ? {
            id: turnoActivo.id,
            pharmacist_name: turnoActivo.pharmacist_name,
            shift_start: turnoActivo.shift_start,
          }
        : null,
      generado_en: now.toISOString(),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
