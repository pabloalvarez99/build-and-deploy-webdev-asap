# Dashboard Operacional Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/admin/operaciones` — a single "morning briefing" page the pharmacist opens each day to see all critical alerts, today's KPIs, and quick actions, aggregated in one API call.

**Architecture:** New `GET /api/admin/operaciones` endpoint aggregates data from orders, product_batches, faltas, purchase_orders, and products in parallel Prisma queries. The page is a 'use client' component that polls every 60s, renders severity-tiered alert sections (critical/urgent/info), and links to the relevant admin pages for action.

**Tech Stack:** Next.js 14 App Router, Prisma 7, Tailwind CSS 3, TypeScript, lucide-react

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `src/app/api/admin/operaciones/route.ts` | Aggregate all operational data in one DB round-trip |
| Create | `src/app/admin/operaciones/page.tsx` | Dashboard UI with severity sections |
| Modify | `src/components/admin/Sidebar.tsx` | Add "Operaciones" navItem at top (after Dashboard) |

---

## Task 1: API — `GET /api/admin/operaciones`

**Files:**
- Create: `src/app/api/admin/operaciones/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
// src/app/api/admin/operaciones/route.ts
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

    // Today boundaries (Chile UTC-4, but use DB server time consistently)
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
      // Reservas expiradas sin procesar
      db.orders.findMany({
        where: {
          status: 'reserved',
          reservation_expires_at: { lt: now },
        },
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

      // Reservas por expirar en <6h
      db.orders.findMany({
        where: {
          status: 'reserved',
          reservation_expires_at: { gte: now, lte: in6h },
        },
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

      // Productos vencidos con stock en lotes
      db.product_batches.findMany({
        where: {
          expiry_date: { lt: now },
          quantity: { gt: 0 },
        },
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

      // Lotes por vencer en 7 días
      db.product_batches.findMany({
        where: {
          expiry_date: { gte: now, lte: in7d },
          quantity: { gt: 0 },
        },
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

      // Faltas pendientes cuyo producto ya tiene stock
      db.faltas.findMany({
        where: {
          status: 'pending',
          products: { stock: { gt: 0 } },
        },
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

      // Total faltas pendientes
      db.faltas.count({ where: { status: 'pending' } }),

      // OC en borrador
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

      // Stock crítico count (low stock, active)
      db.products.count({
        where: {
          active: true,
          stock: { gt: 0, lte: 10 },
        },
      }),

      // Sin stock count (active)
      db.products.count({
        where: { active: true, stock: 0 },
      }),

      // KPIs hoy
      db.orders.aggregate({
        where: {
          created_at: { gte: todayStart },
          status: { in: ['paid', 'completed', 'reserved'] },
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // KPIs ayer
      db.orders.aggregate({
        where: {
          created_at: { gte: yesterdayStart, lte: yesterdayEnd },
          status: { in: ['paid', 'completed', 'reserved'] },
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Pedidos webpay pendientes de confirmación
      db.orders.count({
        where: { status: 'pending', payment_provider: 'webpay' },
      }),
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
        slug: f.products?.slug,
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
```

- [ ] **Step 2: Commit**

```bash
git add pharmacy-ecommerce/apps/web/src/app/api/admin/operaciones/route.ts
git commit -m "feat(api): /api/admin/operaciones — operational dashboard aggregator"
```

---

## Task 2: Page — `/admin/operaciones`

**Files:**
- Create: `src/app/admin/operaciones/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/app/admin/operaciones/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, Clock, CheckCircle2, Loader2, RefreshCw,
  Package, BookX, ShoppingBag, ClipboardList, CalendarClock,
  Calculator, ArrowRight, PhoneCall, AlertCircle, TrendingUp,
  TrendingDown, Minus, Activity,
} from 'lucide-react';

interface ReservaItem {
  id: string;
  nombre: string;
  pickup_code: string | null;
  expiry: string;
  total: number;
}

interface BatchItem {
  id: string;
  producto: string;
  slug: string;
  batch_code: string | null;
  expiry_date: string;
  quantity: number;
}

interface FaltaItem {
  id: string;
  producto: string;
  stock_actual: number;
  cantidad_pedida: number;
  cliente: string | null;
  telefono: string | null;
  slug: string | null;
}

interface OcItem {
  id: string;
  proveedor: string;
  invoice: string | null;
  total_cost: number | null;
  created_at: string;
}

interface DashData {
  reservas_expiradas: ReservaItem[];
  reservas_urgentes: ReservaItem[];
  vencidos: BatchItem[];
  por_vencer_7d: BatchItem[];
  faltas_con_stock: FaltaItem[];
  faltas_pending_total: number;
  oc_borrador: OcItem[];
  stock_critico_count: number;
  stock_cero_count: number;
  kpis: {
    ventas_hoy: number;
    ordenes_hoy: number;
    ventas_ayer: number;
    ordenes_ayer: number;
    pedidos_pendientes_webpay: number;
  };
  generado_en: string;
}

function formatPrice(n: number) {
  return '$' + Math.round(n).toLocaleString('es-CL');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

function timeUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'expirada';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function DeltaBadge({ hoy, ayer }: { hoy: number; ayer: number }) {
  if (ayer === 0) return null;
  const pct = ((hoy - ayer) / ayer) * 100;
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
      up ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
         : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    }`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${color}`}>
      {label}
      {count > 0 && (
        <span className="ml-auto bg-white/30 dark:bg-black/20 rounded-full px-2 py-0.5 text-xs font-bold">
          {count}
        </span>
      )}
    </div>
  );
}

export default function OperacionesPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/operaciones', { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar');
      setData(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, [load]);

  const criticoCount =
    (data?.reservas_expiradas.length ?? 0) +
    (data?.vencidos.length ?? 0);

  const urgenteCount =
    (data?.reservas_urgentes.length ?? 0) +
    (data?.faltas_con_stock.length ?? 0) +
    (data?.oc_borrador.length ?? 0);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="p-6 text-center text-red-500">{error || 'Error al cargar'}</div>
  );

  const { kpis } = data;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-0.5">
            <Activity className="w-6 h-6 text-emerald-600" />
            {greeting()} — Operaciones
          </h1>
          {criticoCount === 0 && urgenteCount === 0 && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-4 h-4" /> Todo en orden
            </p>
          )}
        </div>
        <button onClick={load} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0" title="Actualizar">
          <RefreshCw className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 col-span-2 sm:col-span-2">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
            Ventas hoy <DeltaBadge hoy={kpis.ventas_hoy} ayer={kpis.ventas_ayer} />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(kpis.ventas_hoy)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{kpis.ordenes_hoy} pedidos · ayer {formatPrice(kpis.ventas_ayer)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Stock crítico</div>
          <p className={`text-2xl font-bold ${data.stock_critico_count + data.stock_cero_count > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
            {data.stock_critico_count + data.stock_cero_count}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{data.stock_cero_count} sin stock</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Faltas pendientes</div>
          <p className={`text-2xl font-bold ${data.faltas_pending_total > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
            {data.faltas_pending_total}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{data.faltas_con_stock.length} con stock ya</p>
        </div>
      </div>

      {/* CRITICO */}
      {(data.reservas_expiradas.length > 0 || data.vencidos.length > 0) && (
        <div className="space-y-2">
          <SectionHeader
            label="Crítico — acción inmediata"
            count={criticoCount}
            color="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
          />

          {data.reservas_expiradas.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-red-200 dark:border-red-800 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-red-100 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Reservas expiradas sin procesar ({data.reservas_expiradas.length})
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.reservas_expiradas.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{r.nombre}</p>
                      <p className="text-xs text-slate-400">Código: {r.pickup_code ?? '—'} · Expiró {formatDate(r.expiry)} {formatTime(r.expiry)}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">{formatPrice(r.total)}</p>
                    <Link href={`/admin/ordenes/${r.id}`} className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.vencidos.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-red-200 dark:border-red-800 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-red-100 dark:border-red-800/50 bg-red-50 dark:bg-red-900/10">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                  <CalendarClock className="w-4 h-4" /> Productos vencidos con stock ({data.vencidos.length})
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.vencidos.map(b => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{b.producto}</p>
                      <p className="text-xs text-slate-400">Venció {formatDate(b.expiry_date)} · {b.quantity} unid{b.batch_code ? ` · Lote ${b.batch_code}` : ''}</p>
                    </div>
                    <Link href="/admin/vencimientos" className="shrink-0 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* URGENTE */}
      {(data.reservas_urgentes.length > 0 || data.faltas_con_stock.length > 0 || data.oc_borrador.length > 0) && (
        <div className="space-y-2">
          <SectionHeader
            label="Urgente — atender hoy"
            count={urgenteCount}
            color="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          />

          {data.reservas_urgentes.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-amber-200 dark:border-amber-700 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-amber-100 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/10">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Reservas por expirar ({data.reservas_urgentes.length})
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.reservas_urgentes.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{r.nombre}</p>
                      <p className="text-xs text-slate-400">Código: {r.pickup_code ?? '—'} · Expira en {timeUntil(r.expiry)}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">{formatPrice(r.total)}</p>
                    <Link href={`/admin/ordenes/${r.id}`} className="shrink-0 p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.faltas_con_stock.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-amber-200 dark:border-amber-700 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-amber-100 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/10">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <BookX className="w-4 h-4" /> Faltas con stock disponible ({data.faltas_con_stock.length})
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.faltas_con_stock.map(f => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{f.producto}</p>
                      <p className="text-xs text-slate-400">
                        Stock: {f.stock_actual} · Pedían: {f.cantidad_pedida}
                        {f.cliente ? ` · ${f.cliente}` : ''}
                        {f.telefono ? ` · ${f.telefono}` : ''}
                      </p>
                    </div>
                    {f.telefono && (
                      <a href={`tel:${f.telefono}`} className="shrink-0 p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition-colors">
                        <PhoneCall className="w-4 h-4" />
                      </a>
                    )}
                    <Link href="/admin/faltas" className="shrink-0 p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.oc_borrador.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-amber-200 dark:border-amber-700 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-amber-100 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/10">
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" /> OC en borrador sin confirmar ({data.oc_borrador.length})
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {data.oc_borrador.map(oc => (
                  <div key={oc.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{oc.proveedor}</p>
                      <p className="text-xs text-slate-400">{oc.invoice ?? 'Sin factura'} · {formatDate(oc.created_at)}</p>
                    </div>
                    {oc.total_cost && <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">{formatPrice(oc.total_cost)}</p>}
                    <Link href={`/admin/compras/${oc.id}`} className="shrink-0 p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Por vencer en 7d */}
      {data.por_vencer_7d.length > 0 && (
        <div className="space-y-2">
          <SectionHeader
            label="Vencen en 7 días"
            count={data.por_vencer_7d.length}
            color="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
          />
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-orange-200 dark:border-orange-800 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {data.por_vencer_7d.map(b => (
                <div key={b.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{b.producto}</p>
                    <p className="text-xs text-slate-400">Vence {formatDate(b.expiry_date)} · {b.quantity} unid{b.batch_code ? ` · Lote ${b.batch_code}` : ''}</p>
                  </div>
                  <Link href="/admin/vencimientos" className="shrink-0 p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-500 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">Acciones rápidas</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { href: '/admin/pos', icon: ShoppingBag, label: 'Abrir POS' },
            { href: '/admin/ordenes', icon: ClipboardList, label: 'Ver órdenes', badge: kpis.pedidos_pendientes_webpay || undefined },
            { href: '/admin/arqueo', icon: Calculator, label: 'Arqueo de caja' },
            { href: '/admin/reposicion', icon: Package, label: 'Reposición', badge: data.stock_critico_count + data.stock_cero_count || undefined },
            { href: '/admin/faltas', icon: BookX, label: 'Cuaderno faltas', badge: data.faltas_pending_total || undefined },
            { href: '/admin/vencimientos', icon: CalendarClock, label: 'Vencimientos' },
          ].map(({ href, icon: Icon, label, badge }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group"
            >
              <Icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
              {badge ? (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {badge > 9 ? '9+' : badge}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-400 text-right">
        Actualizado: {new Date(data.generado_en).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add pharmacy-ecommerce/apps/web/src/app/admin/operaciones/page.tsx
git commit -m "feat(admin): /admin/operaciones — dashboard operacional diario"
```

---

## Task 3: Sidebar — add "Operaciones" navItem

**Files:**
- Modify: `src/components/admin/Sidebar.tsx`

- [ ] **Step 1: Add import for Activity icon and navItem**

In `Sidebar.tsx`, add `Activity` to the lucide-react import list and insert the navItem at position 2 (after Dashboard, before POS):

```typescript
// Add to import:
Activity,

// In navItems array, insert after Dashboard item:
{ href: '/admin/operaciones', icon: Activity, label: 'Operaciones' },
```

- [ ] **Step 2: Commit**

```bash
git add pharmacy-ecommerce/apps/web/src/components/admin/Sidebar.tsx
git commit -m "feat(sidebar): add Operaciones link"
```

---

## Task 4: Build + deploy

- [ ] **Step 1: Build local**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

Expected: build completes, 0 TypeScript errors.

- [ ] **Step 2: Push to production**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git push origin main
```

- [ ] **Step 3: Update bitácora**

Add entry to `pharmacy-ecommerce/bitacora.md` under a new `## 2026-04-26` section describing the dashboard operacional feature.

---

## Self-Review

**Spec coverage:**
- ✅ API aggregates reservas expiradas, urgentes, vencidos, por_vencer_7d, faltas_con_stock, oc_borrador, stock counts, KPIs hoy/ayer
- ✅ Page renders severity tiers: crítico (red), urgente (amber), 7d (orange)
- ✅ Quick actions with badges
- ✅ Auto-refresh every 60s
- ✅ Links to action pages on each item
- ✅ Phone-call link for faltas with customer phone
- ✅ Delta % badge (ventas hoy vs ayer)
- ✅ Sidebar link added

**Placeholder scan:** None found.

**Type consistency:** All interfaces defined at top of page file; API response shape matches TypeScript interfaces exactly. `DashData.faltas_con_stock[].slug` is `string | null` — Link href uses it safely via `/admin/faltas` fallback.
