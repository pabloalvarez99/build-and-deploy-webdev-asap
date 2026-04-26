import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const db = await getDb();
    const now = new Date();
    const in6h = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(todayStart.getTime() - 1);

    const [
      reservasExpiradas,
      reservasUrgentes,
      vencidos,
      porVencer7d,
      faltasConStock,
      faltasPendingCount,
      ocBorrador,
      stockCriticoCount,
      stockCeroCount,
      ventasHoy,
      ventasAyer,
      pedidosPendientes,
    ] = await Promise.all([
      db.orders.findMany({
        where: { status: 'reserved', reservation_expires_at: { lt: now } },
        select: {
          id: true,
          guest_name: true,
          guest_surname: true,
          pickup_code: true,
          reservation_expires_at: true,
          total: true,
        },
        orderBy: { reservation_expires_at: 'asc' },
        take: 10,
      }),

      db.orders.findMany({
        where: { status: 'reserved', reservation_expires_at: { gte: now, lte: in6h } },
        select: {
          id: true,
          guest_name: true,
          guest_surname: true,
          pickup_code: true,
          reservation_expires_at: true,
          total: true,
        },
        orderBy: { reservation_expires_at: 'asc' },
        take: 10,
      }),

      db.product_batches.findMany({
        where: { expiry_date: { lt: now }, quantity: { gt: 0 } },
        select: {
          id: true,
          batch_code: true,
          expiry_date: true,
          quantity: true,
          products: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { expiry_date: 'asc' },
        take: 10,
      }),

      db.product_batches.findMany({
        where: { expiry_date: { gte: now, lte: in7d }, quantity: { gt: 0 } },
        select: {
          id: true,
          batch_code: true,
          expiry_date: true,
          quantity: true,
          products: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { expiry_date: 'asc' },
        take: 15,
      }),

      db.faltas.findMany({
        where: { status: 'pending', products: { stock: { gt: 0 } } },
        select: {
          id: true,
          product_name: true,
          quantity: true,
          customer_name: true,
          customer_phone: true,
          products: { select: { stock: true, slug: true } },
        },
        orderBy: { created_at: 'asc' },
        take: 10,
      }),

      db.faltas.count({ where: { status: 'pending' } }),

      db.purchase_orders.findMany({
        where: { status: 'draft' },
        select: {
          id: true,
          invoice_number: true,
          total_cost: true,
          created_at: true,
          suppliers: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 5,
      }),

      db.products.count({ where: { active: true, stock: { gt: 0, lte: 10 } } }),
      db.products.count({ where: { active: true, stock: 0 } }),

      db.orders.aggregate({
        where: {
          created_at: { gte: todayStart },
          status: { in: ['paid', 'completed', 'reserved'] },
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      db.orders.aggregate({
        where: {
          created_at: { gte: yesterdayStart, lte: yesterdayEnd },
          status: { in: ['paid', 'completed', 'reserved'] },
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      db.orders.count({ where: { status: 'pending', payment_provider: 'webpay' } }),
    ]);

    return NextResponse.json({
      reservas_expiradas: reservasExpiradas.map(o => ({
        id: o.id,
        nombre: [o.guest_name, o.guest_surname].filter(Boolean).join(' ') || 'Cliente',
        pickup_code: o.pickup_code,
        expiry: o.reservation_expires_at,
        total: Number(o.total),
      })),
      reservas_urgentes: reservasUrgentes.map(o => ({
        id: o.id,
        nombre: [o.guest_name, o.guest_surname].filter(Boolean).join(' ') || 'Cliente',
        pickup_code: o.pickup_code,
        expiry: o.reservation_expires_at,
        total: Number(o.total),
      })),
      vencidos: vencidos.map(b => ({
        id: b.id,
        producto: b.products.name,
        slug: b.products.slug,
        batch_code: b.batch_code,
        expiry_date: b.expiry_date,
        quantity: b.quantity,
      })),
      por_vencer_7d: porVencer7d.map(b => ({
        id: b.id,
        producto: b.products.name,
        slug: b.products.slug,
        batch_code: b.batch_code,
        expiry_date: b.expiry_date,
        quantity: b.quantity,
      })),
      faltas_con_stock: faltasConStock.map(f => ({
        id: f.id,
        producto: f.product_name,
        stock_actual: f.products?.stock ?? 0,
        cantidad_pedida: f.quantity,
        cliente: f.customer_name,
        telefono: f.customer_phone,
        slug: f.products?.slug ?? null,
      })),
      faltas_pending_total: faltasPendingCount,
      oc_borrador: ocBorrador.map(oc => ({
        id: oc.id,
        proveedor: oc.suppliers.name,
        invoice: oc.invoice_number,
        total_cost: oc.total_cost ? Number(oc.total_cost) : null,
        created_at: oc.created_at,
      })),
      stock_critico_count: stockCriticoCount,
      stock_cero_count: stockCeroCount,
      kpis: {
        ventas_hoy: Number(ventasHoy._sum.total ?? 0),
        ordenes_hoy: ventasHoy._count.id,
        ventas_ayer: Number(ventasAyer._sum.total ?? 0),
        ordenes_ayer: ventasAyer._count.id,
        pedidos_pendientes_webpay: pedidosPendientes,
      },
      generado_en: now.toISOString(),
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
