import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { getDb } from '@/lib/db';

const SETTING_TURNO_INICIO = 'caja_turno_inicio';
const SETTING_FONDO_INICIAL = 'caja_fondo_inicial';

/**
 * GET /api/admin/arqueo
 * Returns current shift sales + last 10 closes + settings
 */
export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();

    const settings = await db.admin_settings.findMany({
      where: { key: { in: [SETTING_TURNO_INICIO, SETTING_FONDO_INICIAL, 'caja_pharmacist_name'] } },
    });
    const settingsMap: Record<string, string> = {};
    for (const s of settings) settingsMap[s.key] = s.value;

    // If no turno_inicio, default to start of today
    const turnoInicio = settingsMap[SETTING_TURNO_INICIO]
      ? new Date(settingsMap[SETTING_TURNO_INICIO])
      : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

    const fondoInicial = parseFloat(settingsMap[SETTING_FONDO_INICIAL] ?? '0');

    // POS sales since turno_inicio
    const posOrders = await db.orders.findMany({
      where: {
        created_at: { gte: turnoInicio },
        status: 'completed',
        payment_provider: { in: ['pos_cash', 'pos_debit', 'pos_credit', 'pos_mixed'] },
      },
      select: { id: true, total: true, payment_provider: true, created_at: true, guest_name: true, guest_surname: true, guest_email: true, cash_amount: true, card_amount: true },
      orderBy: { created_at: 'desc' },
    });

    const ventasEfectivo = posOrders.reduce((s, o) => {
      if (o.payment_provider === 'pos_cash') return s + Number(o.total);
      if (o.payment_provider === 'pos_mixed') return s + Number(o.cash_amount ?? 0);
      return s;
    }, 0);
    const ventasDebito = posOrders.reduce((s, o) => {
      if (o.payment_provider === 'pos_debit') return s + Number(o.total);
      if (o.payment_provider === 'pos_mixed') return s + Number(o.card_amount ?? 0);
      return s;
    }, 0);
    const ventasCredito = posOrders.filter(o => o.payment_provider === 'pos_credit').reduce((s, o) => s + Number(o.total), 0);
    const ventasMixto = posOrders.filter(o => o.payment_provider === 'pos_mixed').reduce((s, o) => s + Number(o.total), 0);
    const ventasTotal = posOrders.reduce((s, o) => s + Number(o.total), 0);
    const efectivoEsperado = fondoInicial + ventasEfectivo;

    // Last 10 closes
    const closes = await db.caja_cierres.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      turno_inicio: turnoInicio.toISOString(),
      fondo_inicial: fondoInicial,
      ventas: {
        efectivo: ventasEfectivo,
        debito: ventasDebito,
        credito: ventasCredito,
        mixto: ventasMixto,
        total: ventasTotal,
        num_transacciones: posOrders.length,
      },
      efectivo_esperado: efectivoEsperado,
      recent_orders: posOrders.slice(0, 20).map(o => ({
        id: o.id,
        total: Number(o.total),
        payment_provider: o.payment_provider,
        created_at: o.created_at.toISOString(),
        customer: o.guest_name ? `${o.guest_name} ${o.guest_surname ?? ''}`.trim() : 'Cliente',
      })),
      pharmacist_name: settingsMap['caja_pharmacist_name'] || null,
      closes: closes.map(c => ({
        id: c.id,
        turno_inicio: c.turno_inicio.toISOString(),
        turno_fin: c.turno_fin.toISOString(),
        ventas_total: Number(c.ventas_total),
        ventas_efectivo: Number(c.ventas_efectivo),
        ventas_debito: Number(c.ventas_debito),
        ventas_credito: Number(c.ventas_credito),
        num_transacciones: c.num_transacciones,
        efectivo_esperado: Number(c.efectivo_esperado),
        efectivo_contado: Number(c.efectivo_contado),
        diferencia: Number(c.diferencia),
        fondo_inicial: Number(c.fondo_inicial),
        notas: c.notas,
        cerrado_por: c.cerrado_por,
        created_at: c.created_at.toISOString(),
      })),
    });
  } catch (e) {
    console.error('arqueo GET error:', e);
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
}

/**
 * POST /api/admin/arqueo
 * action: 'cerrar' — closes current shift and stores the record
 * action: 'set_fondo' — updates fondo inicial
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json();
    const { action } = body;
    const db = await getDb();

    if (action === 'set_pharmacist_shift') {
      const { pharmacist_name, pharmacist_rut } = body;
      if (!pharmacist_name || !pharmacist_rut) {
        return errorResponse('pharmacist_name y pharmacist_rut requeridos', 400);
      }
      const shift = await db.pharmacist_shifts.create({
        data: {
          pharmacist_name,
          pharmacist_rut,
          shift_start: new Date(),
        },
      });
      await Promise.all([
        db.admin_settings.upsert({
          where: { key: 'caja_pharmacist_shift_id' },
          update: { value: shift.id },
          create: { key: 'caja_pharmacist_shift_id', value: shift.id },
        }),
        db.admin_settings.upsert({
          where: { key: 'caja_pharmacist_name' },
          update: { value: pharmacist_name },
          create: { key: 'caja_pharmacist_name', value: pharmacist_name },
        }),
      ]);
      return NextResponse.json({ ok: true, shift_id: shift.id });
    }

    if (action === 'close_pharmacist_shift') {
      const shiftIdSetting = await db.admin_settings.findUnique({ where: { key: 'caja_pharmacist_shift_id' } });
      if (shiftIdSetting?.value) {
        await db.pharmacist_shifts.update({
          where: { id: shiftIdSetting.value },
          data: { shift_end: new Date(), notes: body.notes || null },
        });
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'set_fondo') {
      const { fondo } = body;
      if (typeof fondo !== 'number' || fondo < 0) return errorResponse('Fondo inválido', 400);
      await db.admin_settings.upsert({
        where: { key: SETTING_FONDO_INICIAL },
        update: { value: String(fondo) },
        create: { key: SETTING_FONDO_INICIAL, value: String(fondo) },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'cerrar') {
      const { efectivo_contado, notas, fondo_nuevo } = body;
      if (typeof efectivo_contado !== 'number') return errorResponse('efectivo_contado requerido', 400);

      const settings = await db.admin_settings.findMany({
        where: { key: { in: [SETTING_TURNO_INICIO, SETTING_FONDO_INICIAL] } },
      });
      const settingsMap: Record<string, string> = {};
      for (const s of settings) settingsMap[s.key] = s.value;

      const turnoInicio = settingsMap[SETTING_TURNO_INICIO]
        ? new Date(settingsMap[SETTING_TURNO_INICIO])
        : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();

      const fondoInicial = parseFloat(settingsMap[SETTING_FONDO_INICIAL] ?? '0');

      const posOrders = await db.orders.findMany({
        where: {
          created_at: { gte: turnoInicio },
          status: 'completed',
          payment_provider: { in: ['pos_cash', 'pos_debit', 'pos_credit', 'pos_mixed'] },
        },
        select: { total: true, payment_provider: true, cash_amount: true, card_amount: true },
      });

      const ventasEfectivo = posOrders.reduce((s, o) => {
        if (o.payment_provider === 'pos_cash') return s + Number(o.total);
        if (o.payment_provider === 'pos_mixed') return s + Number(o.cash_amount ?? 0);
        return s;
      }, 0);
      const ventasDebito = posOrders.reduce((s, o) => {
        if (o.payment_provider === 'pos_debit') return s + Number(o.total);
        if (o.payment_provider === 'pos_mixed') return s + Number(o.card_amount ?? 0);
        return s;
      }, 0);
      const ventasCredito = posOrders.filter(o => o.payment_provider === 'pos_credit').reduce((s, o) => s + Number(o.total), 0);
      const ventasTotal = posOrders.reduce((s, o) => s + Number(o.total), 0);
      const efectivoEsperado = fondoInicial + ventasEfectivo;
      const diferencia = efectivo_contado - efectivoEsperado;
      const now = new Date();

      const cierre = await db.caja_cierres.create({
        data: {
          turno_inicio: turnoInicio,
          turno_fin: now,
          fondo_inicial: fondoInicial,
          ventas_efectivo: ventasEfectivo,
          ventas_debito: ventasDebito,
          ventas_credito: ventasCredito,
          ventas_total: ventasTotal,
          num_transacciones: posOrders.length,
          efectivo_esperado: efectivoEsperado,
          efectivo_contado: efectivo_contado,
          diferencia: diferencia,
          notas: notas || null,
          cerrado_por: admin.email || 'admin',
        },
      });

      // Update turno_inicio to now + set new fondo
      await Promise.all([
        db.admin_settings.upsert({
          where: { key: SETTING_TURNO_INICIO },
          update: { value: now.toISOString() },
          create: { key: SETTING_TURNO_INICIO, value: now.toISOString() },
        }),
        db.admin_settings.upsert({
          where: { key: SETTING_FONDO_INICIAL },
          update: { value: String(fondo_nuevo ?? 0) },
          create: { key: SETTING_FONDO_INICIAL, value: String(fondo_nuevo ?? 0) },
        }),
      ]);

      return NextResponse.json({ success: true, cierre_id: cierre.id, diferencia });
    }

    return errorResponse('Acción no reconocida', 400);
  } catch (e) {
    console.error('arqueo POST error:', e);
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
}
