import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export const dynamic = 'force-dynamic';

interface FeedEvent {
  id: string;
  type: 'audit' | 'sale' | 'caja_close' | 'stock' | 'task_done' | 'purchase';
  severity: 'info' | 'positive' | 'warning';
  icon: string;
  user?: string | null;
  title: string;
  detail?: string;
  amount?: number;
  href?: string;
  at: string;
}

export async function GET(req: NextRequest) {
  try {
    const owner = await getOwnerUser();
    if (!owner) return errorResponse('Unauthorized', 403);
    const db = await getDb();

    const url = new URL(req.url);
    const limit = Math.min(200, parseInt(url.searchParams.get('limit') ?? '60', 10));
    const sinceParam = url.searchParams.get('since');
    const sinceFallback = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const since = sinceParam ? new Date(sinceParam) : sinceFallback;
    const typeFilter = url.searchParams.get('type');

    const events: FeedEvent[] = [];

    // Audit log (mutaciones admin)
    if (!typeFilter || typeFilter === 'audit') {
      const audits = await db.audit_log.findMany({
        where: { created_at: { gte: since } },
        select: {
          id: true, action: true, entity: true, entity_name: true, user_email: true, created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
      for (const a of audits) {
        const verb = a.action === 'create' ? 'creó' : a.action === 'update' ? 'actualizó' : 'eliminó';
        events.push({
          id: `audit:${a.id}`,
          type: 'audit',
          severity: a.action === 'delete' ? 'warning' : 'info',
          icon: a.action === 'delete' ? 'trash' : a.action === 'create' ? 'plus' : 'edit',
          user: a.user_email,
          title: `${verb} ${a.entity}${a.entity_name ? `: ${a.entity_name}` : ''}`,
          at: a.created_at.toISOString(),
        });
      }
    }

    // Ventas (POS + online completadas)
    if (!typeFilter || typeFilter === 'sale') {
      const orders = await db.orders.findMany({
        where: {
          created_at: { gte: since },
          status: { in: ['paid', 'completed'] },
        },
        select: {
          id: true, total: true, payment_provider: true, sold_by_name: true, created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
      for (const o of orders) {
        const isPos = o.payment_provider?.startsWith('pos_');
        events.push({
          id: `sale:${o.id}`,
          type: 'sale',
          severity: 'positive',
          icon: 'shopping-bag',
          user: o.sold_by_name ?? null,
          title: isPos ? 'Venta POS' : 'Venta online',
          amount: Number(o.total),
          href: `/admin/ordenes/${o.id}`,
          at: o.created_at.toISOString(),
        });
      }
    }

    // Cierres de caja
    if (!typeFilter || typeFilter === 'caja_close') {
      const cierres = await db.caja_cierres.findMany({
        where: { created_at: { gte: since } },
        select: {
          id: true, ventas_total: true, diferencia: true, cerrado_por: true, created_at: true, num_transacciones: true,
        },
        orderBy: { created_at: 'desc' },
        take: 30,
      });
      for (const c of cierres) {
        const dif = Number(c.diferencia);
        events.push({
          id: `caja:${c.id}`,
          type: 'caja_close',
          severity: Math.abs(dif) > 1000 ? 'warning' : 'info',
          icon: 'calculator',
          user: c.cerrado_por,
          title: `Cierre de caja${dif === 0 ? ' cuadrado' : dif > 0 ? ` con sobrante ${dif.toLocaleString('es-CL')}` : ` con faltante ${Math.abs(dif).toLocaleString('es-CL')}`}`,
          detail: `${c.num_transacciones} transacciones · total ${Number(c.ventas_total).toLocaleString('es-CL')}`,
          href: '/admin/turnos',
          at: c.created_at.toISOString(),
        });
      }
    }

    // Stock movements (ajustes manuales)
    if (!typeFilter || typeFilter === 'stock') {
      const movs = await db.stock_movements.findMany({
        where: {
          created_at: { gte: since },
          reason: { in: ['adjustment', 'damage', 'expired', 'count_correction'] },
        },
        select: {
          id: true, delta: true, reason: true, admin_id: true, created_at: true,
          products: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 40,
      });
      for (const m of movs) {
        events.push({
          id: `stock:${m.id}`,
          type: 'stock',
          severity: m.delta < 0 ? 'warning' : 'info',
          icon: 'arrow-up-down',
          user: m.admin_id,
          title: `Ajuste stock: ${m.products?.name ?? 'producto'}`,
          detail: `${m.delta > 0 ? '+' : ''}${m.delta} u (${m.reason})`,
          at: m.created_at.toISOString(),
        });
      }
    }

    // Tareas completadas
    if (!typeFilter || typeFilter === 'task_done') {
      const tasks = await db.internal_tasks.findMany({
        where: {
          status: 'done',
          completed_at: { gte: since },
        },
        select: {
          id: true, title: true, completed_by_name: true, completed_at: true, priority: true,
        },
        orderBy: { completed_at: 'desc' },
        take: 30,
      });
      for (const t of tasks) {
        if (!t.completed_at) continue;
        events.push({
          id: `task:${t.id}`,
          type: 'task_done',
          severity: 'positive',
          icon: 'check-square',
          user: t.completed_by_name,
          title: `Tarea completada: ${t.title}`,
          href: '/admin/tareas',
          at: t.completed_at.toISOString(),
        });
      }
    }

    // Compras recibidas
    if (!typeFilter || typeFilter === 'purchase') {
      const pos = await db.purchase_orders.findMany({
        where: {
          status: 'received',
          updated_at: { gte: since },
        },
        select: {
          id: true, total_cost: true, invoice_number: true, updated_at: true, created_by: true,
          suppliers: { select: { name: true } },
        },
        orderBy: { updated_at: 'desc' },
        take: 20,
      });
      for (const p of pos) {
        events.push({
          id: `po:${p.id}`,
          type: 'purchase',
          severity: 'info',
          icon: 'truck',
          user: p.created_by,
          title: `OC recibida: ${p.suppliers?.name ?? 'proveedor'}${p.invoice_number ? ` · ${p.invoice_number}` : ''}`,
          amount: p.total_cost ? Number(p.total_cost) : undefined,
          href: `/admin/compras/${p.id}`,
          at: p.updated_at.toISOString(),
        });
      }
    }

    // Sort desc + truncate
    events.sort((a, b) => (a.at < b.at ? 1 : -1));
    const sliced = events.slice(0, limit);

    return NextResponse.json({
      generated_at: new Date().toISOString(),
      count: sliced.length,
      events: sliced,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
