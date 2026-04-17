import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

function csvCell(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function formatPayment(provider: string | null): string {
  switch (provider) {
    case 'webpay': return 'Webpay Plus';
    case 'store': return 'Retiro tienda';
    case 'pos_cash': return 'POS Efectivo';
    case 'pos_debit': return 'POS Débito';
    case 'pos_credit': return 'POS Crédito';
    default: return provider || '';
  }
}

function formatStatus(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pendiente', reserved: 'Reservado', paid: 'Pagado',
    processing: 'Procesando', shipped: 'Enviado', delivered: 'Entregado',
    cancelled: 'Cancelado', completed: 'Completado',
  };
  return map[status] || status;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const sp = request.nextUrl.searchParams;
    const status = sp.get('status');
    const channel = sp.get('channel');
    const from = sp.get('from');
    const to = sp.get('to');

    const db = await getDb();

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (channel === 'pos') {
      where.payment_provider = { in: ['pos_cash', 'pos_debit', 'pos_credit'] };
    } else if (channel === 'online') {
      where.payment_provider = { notIn: ['pos_cash', 'pos_debit', 'pos_credit'] };
    }
    if (from || to) {
      where.created_at = {
        ...(from ? { gte: new Date(from + 'T00:00:00.000Z') } : {}),
        ...(to ? { lte: new Date(to + 'T23:59:59.999Z') } : {}),
      };
    }

    const orders = await db.orders.findMany({
      where,
      include: { order_items: true },
      orderBy: { created_at: 'desc' },
      take: 10000,
    });

    const headers = [
      'Fecha', 'Orden ID', 'Estado', 'Método Pago',
      'Cliente', 'Email', 'Teléfono',
      'Producto', 'SKU', 'Cantidad', 'Precio Unitario (CLP)', 'Subtotal Ítem (CLP)',
      'Total Orden (CLP)',
    ];

    const rows: string[] = ['\uFEFF' + headers.join(',')];

    for (const order of orders) {
      const date = order.created_at.toLocaleDateString('es-CL', {
        timeZone: 'America/Santiago',
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
      const customer = order.guest_name
        ? `${order.guest_name} ${order.guest_surname || ''}`.trim()
        : order.user_id ? 'Usuario registrado' : 'Invitado';
      const email = order.guest_email || '';
      const phone = order.customer_phone || '';
      const payment = formatPayment(order.payment_provider);
      const statusLabel = formatStatus(order.status);
      const orderTotal = Number(order.total);

      if (order.order_items.length === 0) {
        // Order with no items (edge case) — emit single row
        rows.push([
          date, order.id, statusLabel, payment,
          customer, email, phone,
          '', '', '', '', '',
          orderTotal,
        ].map(csvCell).join(','));
      } else {
        for (const item of order.order_items) {
          const unitPrice = Number(item.price_at_purchase);
          const subtotal = unitPrice * item.quantity;
          rows.push([
            date, order.id, statusLabel, payment,
            customer, email, phone,
            item.product_name || '', item.product_id || '', item.quantity, unitPrice, subtotal,
            orderTotal,
          ].map(csvCell).join(','));
        }
      }
    }

    const csv = rows.join('\n');
    const filename = `ordenes_detallado_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error('GET /api/admin/orders/export error:', e);
    return errorResponse('Error exportando órdenes', 500);
  }
}
