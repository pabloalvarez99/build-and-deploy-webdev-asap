import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';
import { getDb } from '@/lib/db';

const PAYMENT_LABELS: Record<string, string> = {
  webpay: 'Webpay Plus',
  store: 'Retiro tienda',
  pos_cash: 'Efectivo POS',
  pos_debit: 'Débito POS',
  pos_credit: 'Crédito POS',
};

function csvEscape(v: string | number | null | undefined): string {
  const s = String(v ?? '');
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

    const db = await getDb();

    type OrderRow = {
      id: string;
      created_at: Date;
      total: string | number;
      payment_provider: string | null;
      guest_name: string | null;
      guest_surname: string | null;
      profile_name: string | null;
    };

    const orders = await db.$queryRaw<OrderRow[]>`
      SELECT
        o.id,
        o.created_at,
        o.total::text AS total,
        o.payment_provider,
        o.guest_name,
        o.guest_surname,
        p.name AS profile_name
      FROM orders o
      LEFT JOIN profiles p ON p.id = o.user_id
      WHERE o.status IN ('paid', 'completed', 'processing', 'shipped', 'delivered')
        AND o.created_at >= ${new Date(from + 'T00:00:00Z')}
        AND o.created_at <= ${new Date(to + 'T23:59:59Z')}
      ORDER BY o.created_at DESC
    `;

    const headers = ['Fecha', 'Folio', 'RUT', 'Cliente', 'Método pago', 'Neto', 'IVA', 'Total'];

    const rows = orders.map((o) => {
      const total = Math.round(Number(o.total));
      const neto = Math.round(total / 1.19);
      const iva = total - neto;
      const clientName = o.profile_name
        || [o.guest_name, o.guest_surname].filter(Boolean).join(' ')
        || 'Sin nombre';
      const fecha = new Date(o.created_at).toISOString().split('T')[0];
      const folio = o.id.replace(/-/g, '').slice(0, 8).toUpperCase();
      const metodo = PAYMENT_LABELS[o.payment_provider ?? ''] ?? o.payment_provider ?? '—';

      return [fecha, folio, '', clientName, metodo, neto, iva, total];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\r\n');

    return new NextResponse('﻿' + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="libro_ventas_${from}_${to}.csv"`,
      },
    });
  } catch (err) {
    console.error('[libro-ventas]', err);
    return errorResponse('Error al generar libro de ventas', 500);
  }
}
