# ERP Operaciones Farmacia — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete pharmacy ERP covering P&L visibility, prescription records (libro de recetas), pharmacist shift tracking, nightly email summary, and express supplier orders.

**Architecture:** Extend existing `/api/admin/operaciones`, `/admin/pos`, and `/admin/arqueo` surfaces. Add two new DB tables (`prescription_records`, `pharmacist_shifts`) via `prisma db push`. New routes follow existing patterns: `getAdminUser()` auth, `getDb()` Prisma client, `errorResponse()` for errors.

**Tech Stack:** Next.js 14, Prisma 7, PostgreSQL 15 (Cloud SQL), Resend email, Tailwind CSS, Lucide icons, localStorage for pharmacist session state.

**No test framework present** — verification step is `NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build` run from `pharmacy-ecommerce/apps/web/`.

---

## File Map

**Create:**
- `src/lib/controlled-substances.ts` — hardcoded list of controlled active ingredients
- `src/app/api/admin/prescriptions/route.ts` — GET list + POST create prescription record
- `src/app/admin/libro-recetas/page.tsx` — prescription records table + print view
- `src/app/api/cron/daily-summary/route.ts` — nightly email cron (02:00 UTC)

**Modify:**
- `src/app/api/admin/operaciones/route.ts` — add P&L + metas queries
- `src/app/admin/operaciones/page.tsx` — add meta progress bar + P&L cards
- `src/app/admin/configuracion/page.tsx` — add daily/monthly sales target inputs
- `prisma/schema.prisma` — add `prescription_records` + `pharmacist_shifts` models
- `src/app/admin/pos/page.tsx` — add full prescription modal before sale confirm
- `src/app/api/admin/pos/sale/route.ts` — accept + persist prescription data
- `src/app/admin/arqueo/page.tsx` — add pharmacist shift modal on turno open
- `src/app/api/admin/arqueo/route.ts` — accept pharmacist data on `set_fondo` action
- `vercel.json` — add `daily-summary` cron entry
- `src/app/admin/reposicion/page.tsx` — add express order modal

---

## Task 1: P&L + Metas — API Extension

**Files:**
- Modify: `src/app/api/admin/operaciones/route.ts`

No DB migration needed. Extends the existing `Promise.all` with 3 new queries and reads 2 admin_settings keys.

- [ ] **Step 1: Add new queries to operaciones route**

Open `src/app/api/admin/operaciones/route.ts`. After the `const yesterdayEnd` line, add:

```ts
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
```

Add these 3 entries at the END of the existing `Promise.all` array (after `pedidosPendientes`):

```ts
      // Cost of sales today (only products with cost_price > 0)
      db.$queryRaw<{ costo_hoy: string }[]>`
        SELECT COALESCE(SUM(oi.quantity * p.cost_price), 0)::text AS costo_hoy
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= ${todayStart}
          AND o.status IN ('paid', 'completed')
          AND p.cost_price > 0
      `,

      // Sales this month
      db.orders.aggregate({
        where: {
          created_at: { gte: monthStart },
          status: { in: ['paid', 'completed', 'reserved'] },
        },
        _sum: { total: true },
        _count: { id: true },
      }),

      // Sales targets from admin_settings
      db.admin_settings.findMany({
        where: { key: { in: ['daily_sales_target', 'monthly_sales_target'] } },
        select: { key: true, value: true },
      }),
```

- [ ] **Step 2: Destructure new results**

Update the destructuring of `Promise.all` to add at the end:

```ts
      costoHoyRows,
      ventasMes,
      targetSettings,
```

- [ ] **Step 3: Build P&L + metas response objects**

After the `Promise.all`, before `return NextResponse.json(...)`, add:

```ts
    const costoHoy = Number(costoHoyRows[0]?.costo_hoy ?? 0);
    const ventasHoyNum = Number(ventasHoy._sum.total ?? 0);
    const margenBrutoHoy = ventasHoyNum - costoHoy;
    const costoCalculable = costoHoy > 0;
    const targetsMap = Object.fromEntries(targetSettings.map((s: { key: string; value: string }) => [s.key, s.value]));
    const metaDiaria = targetsMap['daily_sales_target'] ? Number(targetsMap['daily_sales_target']) : null;
    const metaMensual = targetsMap['monthly_sales_target'] ? Number(targetsMap['monthly_sales_target']) : null;
    const ventasMesNum = Number(ventasMes._sum.total ?? 0);
```

- [ ] **Step 4: Add pl + metas to response JSON**

Inside `return NextResponse.json({`, add after `generado_en`:

```ts
      pl: {
        costo_hoy: costoHoy,
        margen_bruto_hoy: margenBrutoHoy,
        margen_pct_hoy: ventasHoyNum > 0 ? Math.round((margenBrutoHoy / ventasHoyNum) * 100) : 0,
        costo_calculable: costoCalculable,
      },
      metas: {
        diaria: metaDiaria,
        mensual: metaMensual,
        ventas_mes: ventasMesNum,
        ordenes_mes: ventasMes._count.id,
        pct_diario: metaDiaria && metaDiaria > 0 ? Math.round((ventasHoyNum / metaDiaria) * 100) : null,
        pct_mensual: metaMensual && metaMensual > 0 ? Math.round((ventasMesNum / metaMensual) * 100) : null,
      },
```

- [ ] **Step 5: Build**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

Expected: no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add pharmacy-ecommerce/apps/web/src/app/api/admin/operaciones/route.ts
git commit -m "feat(operaciones): add P&L + metas queries to operaciones API"
```

---

## Task 2: P&L + Metas — Operaciones Page UI

**Files:**
- Modify: `src/app/admin/operaciones/page.tsx`

- [ ] **Step 1: Extend DashData interface**

In `page.tsx`, add to the `DashData` interface (after `kpis`):

```ts
  pl: {
    costo_hoy: number;
    margen_bruto_hoy: number;
    margen_pct_hoy: number;
    costo_calculable: boolean;
  };
  metas: {
    diaria: number | null;
    mensual: number | null;
    ventas_mes: number;
    ordenes_mes: number;
    pct_diario: number | null;
    pct_mensual: number | null;
  };
```

- [ ] **Step 2: Add MetaBar component**

After the `DeltaBadge` component definition, add:

```tsx
function MetaBar({ label, actual, meta, pct }: { label: string; actual: number; meta: number; pct: number }) {
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500';
  const textColor = pct >= 80 ? 'text-emerald-700 dark:text-emerald-300' : pct >= 50 ? 'text-amber-700 dark:text-amber-300' : 'text-red-700 dark:text-red-300';
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`text-xs font-bold ${textColor}`}>{pct}%</span>
      </div>
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
        {formatPrice(actual)} <span className="font-normal text-slate-400">/ {formatPrice(meta)}</span>
      </p>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Insert meta + P&L blocks in JSX**

In the return JSX, insert AFTER the `{/* KPI row */}` block and BEFORE the `{/* Caja status */}` block:

```tsx
      {/* Metas de ventas */}
      {data.metas.diaria && (
        <MetaBar
          label="Meta diaria"
          actual={kpis.ventas_hoy}
          meta={data.metas.diaria}
          pct={data.metas.pct_diario ?? 0}
        />
      )}
      {data.metas.mensual && (
        <MetaBar
          label="Meta mensual"
          actual={data.metas.ventas_mes}
          meta={data.metas.mensual}
          pct={data.metas.pct_mensual ?? 0}
        />
      )}

      {/* P&L */}
      {data.pl.costo_calculable ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Margen bruto hoy</div>
            <p className={`text-xl font-bold ${data.pl.margen_bruto_hoy >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatPrice(data.pl.margen_bruto_hoy)}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{data.pl.margen_pct_hoy}% margen</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Costo ventas hoy</div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatPrice(data.pl.costo_hoy)}</p>
            <p className="text-xs text-slate-400 mt-0.5">solo productos con costo cargado</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Carga <code className="font-mono mx-1">cost_price</code> en productos para ver margen bruto.
        </div>
      )}
```

- [ ] **Step 4: Build + commit**

```bash
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
git add pharmacy-ecommerce/apps/web/src/app/admin/operaciones/page.tsx
git commit -m "feat(operaciones): add meta progress bars + P&L cards to dashboard"
```

---

## Task 3: Metas — Configuración Page

**Files:**
- Modify: `src/app/admin/configuracion/page.tsx`

- [ ] **Step 1: Add state variables**

After `const [pharmacyWebsite, setPharmacyWebsite] = useState('');`, add:

```ts
  const [dailyTarget, setDailyTarget] = useState('');
  const [monthlyTarget, setMonthlyTarget] = useState('');
```

- [ ] **Step 2: Load from API**

In the `.then(data => { ... })` block of the `useEffect`, add:

```ts
        setDailyTarget(data.daily_sales_target || '');
        setMonthlyTarget(data.monthly_sales_target || '');
```

- [ ] **Step 3: Include in save payload**

In `handleSave`, add to the JSON body:

```ts
          daily_sales_target: dailyTarget,
          monthly_sales_target: monthlyTarget,
```

- [ ] **Step 4: Add form section**

In the JSX, add a new `<section>` after the existing pharmacy info section (before the save button):

```tsx
        {/* Metas de ventas */}
        <section className="border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> Metas de Ventas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Meta diaria ($CLP)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={dailyTarget}
                onChange={e => setDailyTarget(e.target.value)}
                placeholder="Ej: 600000"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400 mb-1 block">Meta mensual ($CLP)</label>
              <input
                type="number"
                min="0"
                step="10000"
                value={monthlyTarget}
                onChange={e => setMonthlyTarget(e.target.value)}
                placeholder="Ej: 15000000"
                className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400">Si no hay meta configurada, las barras de progreso no aparecen en Operaciones.</p>
        </section>
```

Add `TrendingUp` to the existing lucide import line.

- [ ] **Step 5: Build + commit**

```bash
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
git add pharmacy-ecommerce/apps/web/src/app/admin/configuracion/page.tsx
git commit -m "feat(configuracion): add daily/monthly sales target inputs"
```

---

## Task 4: Schema Migration — prescription_records + pharmacist_shifts

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add models to schema**

At the end of `prisma/schema.prisma`, add:

```prisma
model prescription_records {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  order_id            String?   @db.Uuid
  product_id          String?   @db.Uuid
  product_name        String    @db.VarChar(255)
  quantity            Int
  prescription_number String?   @db.VarChar(100)
  patient_name        String    @db.VarChar(255)
  patient_rut         String?   @db.VarChar(20)
  doctor_name         String?   @db.VarChar(255)
  medical_center      String?   @db.VarChar(255)
  prescription_date   DateTime? @db.Date
  is_controlled       Boolean   @default(false)
  dispensed_by        String?   @db.VarChar(255)
  dispensed_at        DateTime  @default(now()) @db.Timestamptz(6)
  orders              orders?   @relation(fields: [order_id], references: [id], onDelete: SetNull)
  products            products? @relation(fields: [product_id], references: [id], onDelete: SetNull)

  @@index([dispensed_at])
  @@index([patient_rut])
}

model pharmacist_shifts {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  pharmacist_name String    @db.VarChar(255)
  pharmacist_rut  String    @db.VarChar(20)
  shift_start     DateTime  @db.Timestamptz(6)
  shift_end       DateTime? @db.Timestamptz(6)
  notes           String?
  created_at      DateTime  @default(now()) @db.Timestamptz(6)

  @@index([shift_start])
}
```

Also add back-relations to the existing models. In the `orders` model, add:

```prisma
  prescription_records prescription_records[]
```

In the `products` model, add:

```prisma
  prescription_records prescription_records[]
```

- [ ] **Step 2: Authorize IP + run db push**

```bash
GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
MY_IP=$(curl -s https://api.ipify.org)
"$GCLOUD" sql instances patch tu-farmacia-db --authorized-networks="$MY_IP/32" --project=tu-farmacia-prod

cd pharmacy-ecommerce/apps/web
DATABASE_URL="postgresql://farmacia:srcmlaYhkEo19YivrG4FDLH0woou@34.39.232.207:5432/farmacia" \
  ./node_modules/.bin/prisma db push

"$GCLOUD" sql instances patch tu-farmacia-db --clear-authorized-networks --project=tu-farmacia-prod
```

Expected: "Your database is now in sync with your Prisma schema."

- [ ] **Step 3: Build + commit**

```bash
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
git add pharmacy-ecommerce/apps/web/prisma/schema.prisma
git commit -m "feat(schema): add prescription_records + pharmacist_shifts tables"
```

---

## Task 5: Controlled Substances Helper

**Files:**
- Create: `src/lib/controlled-substances.ts`

- [ ] **Step 1: Create the file**

```ts
// Principios activos sujetos a control según Decreto 404 (Chile)
const CONTROLLED = new Set([
  'clonazepam', 'alprazolam', 'lorazepam', 'diazepam', 'bromazepam',
  'midazolam', 'nitrazepam', 'flunitrazepam', 'triazolam',
  'morfina', 'codeína', 'tramadol', 'oxicodona', 'hidromorfona',
  'fentanilo', 'buprenorfina', 'metadona', 'meperidina',
  'metilfenidato', 'anfetamina', 'modafinilo',
  'fenobarbital', 'butalbital',
  'ketamina', 'dronabinol',
]);

export function isControlledSubstance(activeIngredient: string | null | undefined): boolean {
  if (!activeIngredient) return false;
  const lower = activeIngredient.toLowerCase();
  for (const s of CONTROLLED) {
    if (lower.includes(s)) return true;
  }
  return false;
}
```

- [ ] **Step 2: Commit**

```bash
git add pharmacy-ecommerce/apps/web/src/lib/controlled-substances.ts
git commit -m "feat(lib): add controlled substances list for prescription checks"
```

---

## Task 6: Prescriptions API

**Files:**
- Create: `src/app/api/admin/prescriptions/route.ts`

- [ ] **Step 1: Create GET + POST route**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAdminUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const controlled = searchParams.get('controlled');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;

    const db = await getDb();
    const where = {
      ...(from || to ? {
        dispensed_at: {
          ...(from ? { gte: new Date(from + 'T00:00:00.000Z') } : {}),
          ...(to ? { lte: new Date(to + 'T23:59:59.999Z') } : {}),
        },
      } : {}),
      ...(controlled !== null ? { is_controlled: controlled === 'true' } : {}),
    };

    const [records, total] = await Promise.all([
      db.prescription_records.findMany({
        where,
        orderBy: { dispensed_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.prescription_records.count({ where }),
    ]);

    // KPIs
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
    const [countHoy, countMes] = await Promise.all([
      db.prescription_records.count({ where: { dispensed_at: { gte: todayStart } } }),
      db.prescription_records.count({ where: { dispensed_at: { gte: monthStart } } }),
    ]);

    return NextResponse.json({ records, total, page, limit, kpis: { hoy: countHoy, mes: countMes } });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export interface PrescriptionInput {
  order_id?: string;
  product_id?: string;
  product_name: string;
  quantity: number;
  prescription_number?: string;
  patient_name: string;
  patient_rut?: string;
  doctor_name?: string;
  medical_center?: string;
  prescription_date?: string;
  is_controlled?: boolean;
  dispensed_by?: string;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body: PrescriptionInput = await request.json();
    if (!body.patient_name || !body.product_name || !body.quantity) {
      return errorResponse('patient_name, product_name, quantity requeridos', 400);
    }

    const db = await getDb();
    const record = await db.prescription_records.create({
      data: {
        order_id: body.order_id || null,
        product_id: body.product_id || null,
        product_name: body.product_name,
        quantity: body.quantity,
        prescription_number: body.prescription_number || null,
        patient_name: body.patient_name,
        patient_rut: body.patient_rut || null,
        doctor_name: body.doctor_name || null,
        medical_center: body.medical_center || null,
        prescription_date: body.prescription_date ? new Date(body.prescription_date) : null,
        is_controlled: body.is_controlled ?? false,
        dispensed_by: body.dispensed_by || null,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
```

- [ ] **Step 2: Build + commit**

```bash
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
git add pharmacy-ecommerce/apps/web/src/app/api/admin/prescriptions/route.ts
git commit -m "feat(api): add prescriptions GET + POST routes"
```

---

## Task 7: Libro de Recetas Page

**Files:**
- Create: `src/app/admin/libro-recetas/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Loader2, Printer, Filter, BookOpen, ShieldAlert } from 'lucide-react';

interface PrescriptionRecord {
  id: string;
  product_name: string;
  quantity: number;
  prescription_number: string | null;
  patient_name: string;
  patient_rut: string | null;
  doctor_name: string | null;
  medical_center: string | null;
  prescription_date: string | null;
  is_controlled: boolean;
  dispensed_by: string | null;
  dispensed_at: string;
}

interface PageData {
  records: PrescriptionRecord[];
  total: number;
  kpis: { hoy: number; mes: number };
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function LibroRecetasPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [controlled, setControlled] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (controlled) params.set('controlled', controlled);
      const res = await fetch(`/api/admin/prescriptions?${params}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Error al cargar');
      setData(await res.json());
    } finally { setLoading(false); }
  }, [from, to, controlled]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    load();
  }, [user, router, load]);

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5 print:p-0">
      {/* Header — hidden when printing */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-600" /> Libro de Recetas
        </h1>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      {/* KPIs */}
      {data && (
        <div className="grid grid-cols-2 gap-3 print:hidden">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Recetas hoy</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.kpis.hoy}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Recetas este mes</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.kpis.mes}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500 dark:text-slate-400">Filtros:</span>
        </div>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100" />
        <select value={controlled} onChange={e => setControlled(e.target.value)}
          className="border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-1.5 text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">
          <option value="">Todos</option>
          <option value="true">Solo controlados</option>
          <option value="false">No controlados</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
      ) : data && data.records.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Fecha</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Producto</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Paciente</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">RUT</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Médico</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Nro Receta</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Q</th>
                <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">Farmacéutico</th>
              </tr>
            </thead>
            <tbody>
              {data.records.map(r => (
                <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{fmt(r.dispensed_at)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {r.is_controlled && <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      <span className="text-slate-800 dark:text-slate-100 font-medium">{r.product_name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{r.patient_name}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 font-mono text-xs">{r.patient_rut || '—'}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{r.doctor_name || '—'}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 font-mono text-xs">{r.prescription_number || '—'}</td>
                  <td className="px-3 py-2 text-center text-slate-700 dark:text-slate-200">{r.quantity}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400">{r.dispensed_by || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">Sin registros para el período seleccionado.</div>
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body { font-size: 11px; }
          .print\\:hidden { display: none !important; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ccc; padding: 4px 8px; }
          th { background: #f0f0f0; }
        }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Build + commit**

```bash
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
git add pharmacy-ecommerce/apps/web/src/app/admin/libro-recetas/page.tsx \
        pharmacy-ecommerce/apps/web/src/app/api/admin/prescriptions/route.ts
git commit -m "feat(libro-recetas): add prescription records page + API"
```

---

## Task 8: POS — Prescription Modal

**Files:**
- Modify: `src/app/admin/pos/page.tsx`

The POS page already has `prescriptionPending` state at line 120 (typed as `Product | null`). We'll repurpose it as a full modal system.

- [ ] **Step 1: Replace prescriptionPending state with richer type**

Find (line ~120):
```ts
  const [prescriptionPending, setPrescriptionPending] = useState<Product | null>(null)
```

Replace with:
```ts
  const [prescriptionModal, setPrescriptionModal] = useState<{
    items: Array<{ product_id: string; product_name: string; quantity: number; active_ingredient?: string | null; is_controlled: boolean }>;
    forms: Array<{ patient_name: string; patient_rut: string; doctor_name: string; medical_center: string; prescription_number: string; prescription_date: string; is_controlled: boolean }>;
    currentIdx: number;
  } | null>(null)
```

- [ ] **Step 2: Update Product interface to include active_ingredient**

Find the `Product` interface and add:
```ts
  active_ingredient?: string | null
```

- [ ] **Step 3: Add import for isControlledSubstance**

At the top of the file (after other imports):
```ts
import { isControlledSubstance } from '@/lib/controlled-substances'
```

- [ ] **Step 4: Modify handleSale to intercept prescription items**

Find `async function handleSale()` and replace the body start with:

```ts
  async function handleSale() {
    if (cart.length === 0) return

    // Check if any cart item requires a prescription
    const prescriptionItems = cart.filter(item => {
      const product = products.find(p => p.id === item.product_id)
      return product?.prescription_type === 'retenida' || product?.prescription_type === 'magistral'
    })

    if (prescriptionItems.length > 0 && !prescriptionModal) {
      // Open prescription modal — block sale
      const pharmacistName = typeof window !== 'undefined' ? localStorage.getItem('pharmacist_name') || '' : ''
      setPrescriptionModal({
        items: prescriptionItems.map(item => {
          const product = products.find(p => p.id === item.product_id)
          return {
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            active_ingredient: product?.active_ingredient,
            is_controlled: isControlledSubstance(product?.active_ingredient),
          }
        }),
        forms: prescriptionItems.map(item => {
          const product = products.find(p => p.id === item.product_id)
          return {
            patient_name: '', patient_rut: '', doctor_name: '',
            medical_center: '', prescription_number: '', prescription_date: '',
            is_controlled: isControlledSubstance(product?.active_ingredient),
          }
        }),
        currentIdx: 0,
      })
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)
    // ... rest of existing handleSale logic (keep unchanged)
```

Note: After this change the `setIsProcessing(true)` at the original function start should be moved after the prescription check. The rest of the existing `handleSale` body remains intact.

- [ ] **Step 5: Add confirmWithPrescriptions handler**

After `handleSale`, add:

```ts
  async function confirmWithPrescriptions() {
    if (!prescriptionModal) return
    const incomplete = prescriptionModal.forms.some(f => !f.patient_name.trim())
    if (incomplete) return

    const prescriptionData = prescriptionModal.items.map((item, i) => ({
      ...item,
      ...prescriptionModal.forms[i],
    }))
    setPrescriptionModal(null)
    // Pass prescription data into the sale
    await handleSaleWithPrescriptions(prescriptionData)
  }
```

- [ ] **Step 6: Add handleSaleWithPrescriptions function**

Add after `confirmWithPrescriptions`:

```ts
  async function handleSaleWithPrescriptions(prescriptionData: Array<{
    product_id: string; product_name: string; quantity: number;
    patient_name: string; patient_rut: string; doctor_name: string;
    medical_center: string; prescription_number: string; prescription_date: string;
    is_controlled: boolean;
  }>) {
    setIsProcessing(true)
    try {
      const discountNum = parseFloat(discountValue) || 0
      const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
      const discountAmount = discountType === '%'
        ? Math.round(subtotal * Math.min(discountNum, 100) / 100)
        : Math.min(Math.round(discountNum), subtotal)
      const total = Math.max(0, subtotal - discountAmount)
      const pharmacistName = typeof window !== 'undefined' ? localStorage.getItem('pharmacist_name') || '' : ''

      const res = await fetch('/api/admin/pos/sale', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, price: i.price })),
          payment_method: paymentMethod,
          cash_amount: paymentMethod === 'pos_cash' || paymentMethod === 'pos_mixed' ? parseFloat(cashReceived) || total : undefined,
          card_amount: paymentMethod === 'pos_mixed' ? parseFloat(mixedCard) || 0 : undefined,
          customer_name: customerName || undefined,
          customer_phone: customerPhone || undefined,
          discount_amount: discountAmount || undefined,
          prescription_records: prescriptionData.map(p => ({
            product_id: p.product_id,
            product_name: p.product_name,
            quantity: p.quantity,
            patient_name: p.patient_name,
            patient_rut: p.patient_rut || undefined,
            doctor_name: p.doctor_name || undefined,
            medical_center: p.medical_center || undefined,
            prescription_number: p.prescription_number || undefined,
            prescription_date: p.prescription_date || undefined,
            is_controlled: p.is_controlled,
            dispensed_by: pharmacistName || undefined,
          })),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al procesar venta')
      }
      const data = await res.json()
      const change = paymentMethod === 'pos_cash' ? Math.max(0, parseFloat(cashReceived) - total) : 0
      setSuccessOrder({
        id: data.id, total, items: [...cart], method: paymentMethod,
        customer: customerName || 'Cliente', change, date: new Date().toISOString(),
        discountAmount, loyaltyPointsEarned: data.loyalty_points_earned,
      })
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
      setDiscountValue('')
      setCashReceived('')
      setShowPayModal(false)
      loadTodayStats()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al procesar')
    } finally { setIsProcessing(false) }
  }
```

- [ ] **Step 7: Add prescription modal JSX**

Before the closing `</div>` of the component return, add:

```tsx
      {/* Prescription Modal */}
      {prescriptionModal && (() => {
        const item = prescriptionModal.items[prescriptionModal.currentIdx]
        const form = prescriptionModal.forms[prescriptionModal.currentIdx]
        const setForm = (patch: Partial<typeof form>) => {
          const newForms = [...prescriptionModal.forms]
          newForms[prescriptionModal.currentIdx] = { ...form, ...patch }
          setPrescriptionModal({ ...prescriptionModal, forms: newForms })
        }
        const isLast = prescriptionModal.currentIdx === prescriptionModal.items.length - 1
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md space-y-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-900 dark:text-white">Receta retenida</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{item.product_name} × {item.quantity}</p>
                  {prescriptionModal.items.length > 1 && (
                    <p className="text-xs text-slate-400">{prescriptionModal.currentIdx + 1} / {prescriptionModal.items.length}</p>
                  )}
                </div>
              </div>

              {item.is_controlled && (
                <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-3 py-2">
                  <span className="font-semibold">⚠ Psicotrópico / Estupefaciente</span>
                </div>
              )}

              <div className="space-y-3">
                <input required placeholder="Nombre paciente *" value={form.patient_name}
                  onChange={e => setForm({ patient_name: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
                <input placeholder="RUT paciente" value={form.patient_rut}
                  onChange={e => setForm({ patient_rut: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
                <input placeholder="Médico" value={form.doctor_name}
                  onChange={e => setForm({ doctor_name: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
                <input placeholder="Centro / Clínica" value={form.medical_center}
                  onChange={e => setForm({ medical_center: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
                <input placeholder="Nro. Receta" value={form.prescription_number}
                  onChange={e => setForm({ prescription_number: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
                <input type="date" placeholder="Fecha receta" value={form.prescription_date}
                  onChange={e => setForm({ prescription_date: e.target.value })}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setPrescriptionModal(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Cancelar
                </button>
                {!isLast ? (
                  <button
                    onClick={() => setPrescriptionModal({ ...prescriptionModal, currentIdx: prescriptionModal.currentIdx + 1 })}
                    disabled={!form.patient_name.trim()}
                    className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors disabled:opacity-50">
                    Siguiente →
                  </button>
                ) : (
                  <button onClick={confirmWithPrescriptions} disabled={!form.patient_name.trim()}
                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    Confirmar venta
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}
```

- [ ] **Step 8: Build + commit**

```bash
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
git add pharmacy-ecommerce/apps/web/src/app/admin/pos/page.tsx \
        pharmacy-ecommerce/apps/web/src/lib/controlled-substances.ts
git commit -m "feat(pos): add prescription modal for receta retenida/magistral items"
```

---

## Task 9: POS Sale API — Persist Prescription Records

**Files:**
- Modify: `src/app/api/admin/pos/sale/route.ts`

- [ ] **Step 1: Accept prescription_records in request body**

Find the destructured body interface block:

```ts
    const {
      items,
      payment_method,
      ...
      notes,
    }: {
      ...
    } = body;
```

Add `prescription_records` to the destructure:

```ts
      prescription_records,
    }: {
      ...
      prescription_records?: Array<{
        product_id?: string;
        product_name: string;
        quantity: number;
        prescription_number?: string;
        patient_name: string;
        patient_rut?: string;
        doctor_name?: string;
        medical_center?: string;
        prescription_date?: string;
        is_controlled?: boolean;
        dispensed_by?: string;
      }>;
    } = body;
```

- [ ] **Step 2: Create prescription records after the transaction**

After the `const order = await db.$transaction(...)` block and before `checkAndAlertLowStock`, add:

```ts
    // Persist prescription records (non-blocking would lose ISP compliance — keep blocking)
    if (prescription_records && prescription_records.length > 0) {
      await db.prescription_records.createMany({
        data: prescription_records.map(pr => ({
          order_id: order.id,
          product_id: pr.product_id || null,
          product_name: pr.product_name,
          quantity: pr.quantity,
          prescription_number: pr.prescription_number || null,
          patient_name: pr.patient_name,
          patient_rut: pr.patient_rut || null,
          doctor_name: pr.doctor_name || null,
          medical_center: pr.medical_center || null,
          prescription_date: pr.prescription_date ? new Date(pr.prescription_date) : null,
          is_controlled: pr.is_controlled ?? false,
          dispensed_by: pr.dispensed_by || null,
        })),
      });
    }
```

- [ ] **Step 3: Build + commit**

```bash
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
git add pharmacy-ecommerce/apps/web/src/app/api/admin/pos/sale/route.ts
git commit -m "feat(pos-api): persist prescription_records when sale includes receta items"
```

---

## Task 10: Pharmacist Shift in Arqueo

**Files:**
- Modify: `src/app/admin/arqueo/page.tsx`
- Modify: `src/app/api/admin/arqueo/route.ts`

- [ ] **Step 1: Extend arqueo API to store pharmacist on turno open**

In `src/app/api/admin/arqueo/route.ts`, find the `POST` handler. Find the `set_fondo` action block. Add a new action handler alongside (or extend `set_fondo` to also accept pharmacist fields):

After the `set_fondo` block, add a new `set_pharmacist_shift` action:

```ts
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
      // Store active shift id in admin_settings for reference
      await db.admin_settings.upsert({
        where: { key: 'caja_pharmacist_shift_id' },
        update: { value: shift.id },
        create: { key: 'caja_pharmacist_shift_id', value: shift.id },
      });
      await db.admin_settings.upsert({
        where: { key: 'caja_pharmacist_name' },
        update: { value: pharmacist_name },
        create: { key: 'caja_pharmacist_name', value: pharmacist_name },
      });
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
```

Also extend the GET response to include current pharmacist name:

In the GET handler, add to `admin_settings` query keys: `'caja_pharmacist_name'`. Return it in the response as `pharmacist_name: settingsMap['caja_pharmacist_name'] || null`.

- [ ] **Step 2: Add pharmacist shift state to arqueo page**

In `src/app/admin/arqueo/page.tsx`, add state:

```ts
  const [showPharmacistModal, setShowPharmacistModal] = useState(false);
  const [pharmacistName, setPharmacistName] = useState('');
  const [pharmacistRut, setPharmacistRut] = useState('');
  const [savingPharmacist, setSavingPharmacist] = useState(false);
  const [activePharmacist, setActivePharmacist] = useState<string | null>(null);
```

- [ ] **Step 3: Load pharmacist name from API response**

In the `load` function, after `setFondoInput(...)`:
```ts
      setActivePharmacist(json.pharmacist_name || null);
```

- [ ] **Step 4: Add pharmacist modal JSX + button**

After the fondo inicial card, add a pharmacist section:

```tsx
        {/* Farmacéutico en turno */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Farmacéutico en turno</p>
          {activePharmacist ? (
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{activePharmacist}</p>
              <button onClick={() => setShowPharmacistModal(true)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline">
                Cambiar
              </button>
            </div>
          ) : (
            <button onClick={() => setShowPharmacistModal(true)}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
              + Registrar farmacéutico
            </button>
          )}
        </div>
```

Add the modal JSX (before closing `</div>`):

```tsx
      {showPharmacistModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm space-y-4 p-6">
            <h2 className="font-bold text-slate-900 dark:text-white">Farmacéutico en turno</h2>
            <input placeholder="Nombre completo *" value={pharmacistName}
              onChange={e => setPharmacistName(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
            <input placeholder="RUT (ej: 12.345.678-9) *" value={pharmacistRut}
              onChange={e => setPharmacistRut(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100" />
            <div className="flex gap-3">
              <button onClick={() => setShowPharmacistModal(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
              <button
                disabled={!pharmacistName.trim() || !pharmacistRut.trim() || savingPharmacist}
                onClick={async () => {
                  setSavingPharmacist(true);
                  try {
                    const res = await fetch('/api/admin/arqueo', {
                      method: 'POST', credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'set_pharmacist_shift', pharmacist_name: pharmacistName.trim(), pharmacist_rut: pharmacistRut.trim() }),
                    });
                    if (res.ok) {
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('pharmacist_name', pharmacistName.trim());
                      }
                      setActivePharmacist(pharmacistName.trim());
                      setShowPharmacistModal(false);
                      setPharmacistName('');
                      setPharmacistRut('');
                    }
                  } finally { setSavingPharmacist(false); }
                }}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                {savingPharmacist ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 5: Build + commit**

```bash
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
git add pharmacy-ecommerce/apps/web/src/app/admin/arqueo/page.tsx \
        pharmacy-ecommerce/apps/web/src/app/api/admin/arqueo/route.ts
git commit -m "feat(arqueo): add pharmacist shift registration to turno tracking"
```

---

## Task 11: Daily Summary Cron

**Files:**
- Create: `src/app/api/cron/daily-summary/route.ts`
- Modify: `vercel.json`
- Modify: `src/lib/email.ts`

- [ ] **Step 1: Add sendDailySummary to email.ts**

In `src/lib/email.ts`, add after the existing exports:

```ts
export interface DailySummaryData {
  to: string;
  date: string;
  ventas_hoy: number;
  ordenes_hoy: number;
  delta_ventas_pct: number | null;
  margen_bruto: number | null;
  meta_diaria: number | null;
  pct_meta: number | null;
  diferencia_caja: number | null;
  top_productos: { name: string; units: number; revenue: number }[];
  alertas: {
    reservas_por_expirar: number;
    por_vencer_7d: number;
    stock_cero: number;
    faltas_con_stock: number;
  };
}

export async function sendDailySummary(data: DailySummaryData) {
  const resend = getResend();
  const fmtCLP = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(n);
  const delta = data.delta_ventas_pct !== null
    ? `<span style="color:${data.delta_ventas_pct >= 0 ? '#059669' : '#dc2626'}">${data.delta_ventas_pct >= 0 ? '▲' : '▼'} ${Math.abs(data.delta_ventas_pct).toFixed(0)}% vs ayer</span>`
    : '';

  const topTable = data.top_productos.length > 0
    ? `<table width="100%" style="border-collapse:collapse;margin-top:8px;">
        <tr style="background:#f8fafc;"><th style="padding:6px 10px;text-align:left;font-size:12px;">Producto</th><th style="padding:6px 10px;text-align:center;font-size:12px;">Uds.</th><th style="padding:6px 10px;text-align:right;font-size:12px;">Total</th></tr>
        ${data.top_productos.map(p => `<tr><td style="padding:6px 10px;font-size:13px;">${p.name}</td><td style="padding:6px 10px;text-align:center;font-size:13px;">${p.units}</td><td style="padding:6px 10px;text-align:right;font-size:13px;font-weight:600;">${fmtCLP(p.revenue)}</td></tr>`).join('')}
       </table>`
    : '<p style="color:#94a3b8;font-size:13px;">Sin ventas registradas.</p>';

  const alertLines = [
    data.alertas.reservas_por_expirar > 0 ? `⏰ ${data.alertas.reservas_por_expirar} reserva(s) por expirar` : null,
    data.alertas.por_vencer_7d > 0 ? `📦 ${data.alertas.por_vencer_7d} producto(s) vence(n) en 7 días` : null,
    data.alertas.stock_cero > 0 ? `🚫 ${data.alertas.stock_cero} producto(s) sin stock` : null,
    data.alertas.faltas_con_stock > 0 ? `📋 ${data.alertas.faltas_con_stock} falta(s) con stock disponible` : null,
  ].filter(Boolean).join('<br>');

  const html = emailWrapper(`
    <h2 style="color:#0f172a;font-size:20px;margin:0 0 4px;">Resumen del día</h2>
    <p style="color:#64748b;font-size:14px;margin:0 0 24px;">${data.date}</p>

    <table width="100%" style="border-collapse:collapse;margin-bottom:20px;">
      <tr>
        <td style="padding:12px;background:#f0fdf4;border-radius:12px;text-align:center;width:50%;">
          <div style="font-size:24px;font-weight:700;color:#059669;">${fmtCLP(data.ventas_hoy)}</div>
          <div style="font-size:12px;color:#64748b;">Ventas ${delta}</div>
          <div style="font-size:12px;color:#64748b;">${data.ordenes_hoy} pedidos</div>
        </td>
        <td style="width:16px;"></td>
        <td style="padding:12px;background:#f8fafc;border-radius:12px;text-align:center;width:50%;">
          ${data.margen_bruto !== null
            ? `<div style="font-size:24px;font-weight:700;color:#0f172a;">${fmtCLP(data.margen_bruto)}</div><div style="font-size:12px;color:#64748b;">Margen bruto est.</div>`
            : `<div style="font-size:14px;color:#94a3b8;">Sin datos de costo</div>`}
        </td>
      </tr>
    </table>

    ${data.meta_diaria ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px;margin-bottom:20px;">
      <div style="font-size:13px;color:#92400e;font-weight:600;">Meta diaria: ${data.pct_meta}% — ${fmtCLP(data.ventas_hoy)} / ${fmtCLP(data.meta_diaria)}</div>
    </div>` : ''}

    ${data.diferencia_caja !== null ? `<div style="background:#f8fafc;border-radius:12px;padding:12px;margin-bottom:20px;">
      <div style="font-size:13px;color:#334155;">Diferencia de caja: <strong style="color:${data.diferencia_caja === 0 ? '#059669' : data.diferencia_caja > 0 ? '#0284c7' : '#dc2626'}">${fmtCLP(data.diferencia_caja)}</strong></div>
    </div>` : ''}

    <h3 style="font-size:14px;font-weight:600;color:#0f172a;margin:0 0 8px;">Top 5 productos</h3>
    ${topTable}

    ${alertLines ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:12px;margin-top:20px;">
      <div style="font-size:13px;font-weight:600;color:#991b1b;margin-bottom:6px;">Para mañana</div>
      <div style="font-size:13px;color:#7f1d1d;line-height:1.8;">${alertLines}</div>
    </div>` : ''}

    <div style="margin-top:24px;text-align:center;">
      <a href="${BASE}/admin/operaciones" style="background:#059669;color:#fff;padding:10px 24px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600;">Ver Operaciones</a>
    </div>
  `);

  await resend.emails.send({
    from: FROM,
    to: data.to,
    subject: `Resumen ${data.date} — ${fmtCLP(data.ventas_hoy)}`,
    html,
  });
}
```

- [ ] **Step 2: Create daily-summary cron route**

Create `src/app/api/cron/daily-summary/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendDailySummary } from '@/lib/email';

export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = await getDb();
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

    const emailSetting = await db.admin_settings.findUnique({ where: { key: 'alert_email' } });
    if (!emailSetting?.value) return NextResponse.json({ skipped: true, reason: 'No alert_email' });

    const [
      ventasHoy, ventasAyer, costoHoyRows,
      targetSettings, topItems,
      reservasUrgentes, porVencer7d,
      stockCero, faltasConStock,
      lastClose,
    ] = await Promise.all([
      db.orders.aggregate({
        where: { created_at: { gte: todayStart }, status: { in: ['paid', 'completed', 'reserved'] } },
        _sum: { total: true }, _count: { id: true },
      }),
      db.orders.aggregate({
        where: { created_at: { gte: yesterdayStart, lt: todayStart }, status: { in: ['paid', 'completed', 'reserved'] } },
        _sum: { total: true },
      }),
      db.$queryRaw<{ costo_hoy: string }[]>`
        SELECT COALESCE(SUM(oi.quantity * p.cost_price), 0)::text AS costo_hoy
        FROM order_items oi JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE o.created_at >= ${todayStart} AND o.status IN ('paid','completed') AND p.cost_price > 0
      `,
      db.admin_settings.findMany({ where: { key: { in: ['daily_sales_target'] } }, select: { key: true, value: true } }),
      db.order_items.findMany({
        where: { orders: { created_at: { gte: todayStart }, status: { in: ['paid', 'completed'] } } },
        select: { product_name: true, quantity: true, price_at_purchase: true },
      }),
      db.orders.count({ where: { status: 'reserved', reservation_expires_at: { lte: new Date(now.getTime() + 12 * 3600000) } } }),
      db.product_batches.count({ where: { expiry_date: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) }, quantity: { gt: 0 } } }),
      db.products.count({ where: { active: true, stock: 0 } }),
      db.faltas.count({ where: { status: 'pending', products: { stock: { gt: 0 } } } }),
      db.shift_closes.findFirst({ where: { created_at: { gte: todayStart } }, orderBy: { created_at: 'desc' } }),
    ]);

    const ventasHoyNum = Number(ventasHoy._sum.total ?? 0);
    const ventasAyerNum = Number(ventasAyer._sum.total ?? 0);
    const costoHoy = Number(costoHoyRows[0]?.costo_hoy ?? 0);
    const targetsMap = Object.fromEntries(targetSettings.map((s: { key: string; value: string }) => [s.key, s.value]));
    const metaDiaria = targetsMap['daily_sales_target'] ? Number(targetsMap['daily_sales_target']) : null;

    // Aggregate top 5 products
    const productMap: Record<string, { name: string; units: number; revenue: number }> = {};
    topItems.forEach(i => {
      const k = i.product_name;
      if (!productMap[k]) productMap[k] = { name: k, units: 0, revenue: 0 };
      productMap[k].units += i.quantity;
      productMap[k].revenue += i.quantity * Number(i.price_at_purchase);
    });
    const top5 = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const dateLabel = now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Santiago' });

    await sendDailySummary({
      to: emailSetting.value,
      date: dateLabel,
      ventas_hoy: ventasHoyNum,
      ordenes_hoy: ventasHoy._count.id,
      delta_ventas_pct: ventasAyerNum > 0 ? Math.round(((ventasHoyNum - ventasAyerNum) / ventasAyerNum) * 100) : null,
      margen_bruto: costoHoy > 0 ? ventasHoyNum - costoHoy : null,
      meta_diaria: metaDiaria,
      pct_meta: metaDiaria && metaDiaria > 0 ? Math.round((ventasHoyNum / metaDiaria) * 100) : null,
      diferencia_caja: lastClose ? Number(lastClose.diferencia) : null,
      top_productos: top5,
      alertas: { reservas_por_expirar: reservasUrgentes, por_vencer_7d: porVencer7d, stock_cero: stockCero, faltas_con_stock: faltasConStock },
    });

    return NextResponse.json({ sent: true, to: emailSetting.value, ventas: ventasHoyNum });
  } catch (err) {
    console.error('daily-summary cron error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
```

**Note:** The query uses `db.shift_closes` — verify the Prisma model name in schema.prisma (may be `caja_closes` or similar). Replace with the actual model name.

- [ ] **Step 3: Add cron to vercel.json**

In `vercel.json`, add to the `crons` array:

```json
    {
      "path": "/api/cron/daily-summary",
      "schedule": "0 2 * * *"
    }
```

- [ ] **Step 4: Build + commit**

```bash
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
git add pharmacy-ecommerce/apps/web/src/app/api/cron/daily-summary/route.ts \
        pharmacy-ecommerce/apps/web/src/lib/email.ts \
        pharmacy-ecommerce/apps/web/vercel.json
git commit -m "feat(cron): add daily-summary email cron at 02:00 UTC"
```

---

## Task 12: Express Supplier Order

**Files:**
- Modify: `src/app/admin/reposicion/page.tsx`

- [ ] **Step 1: Identify current reposición page structure**

Read `src/app/admin/reposicion/page.tsx` to find: where suppliers are grouped, what state holds supplier product lists, and how `purchase_orders` are created. Look for any existing "Enviar pedido" button or OC creation flow.

- [ ] **Step 2: Add modal state**

Add state variables:

```ts
  const [showExpressModal, setShowExpressModal] = useState(false);
  const [expressSupplier, setExpressSupplier] = useState<{ id: string; name: string; email: string | null } | null>(null);
  const [expressItems, setExpressItems] = useState<{ product_id: string; product_name: string; qty: number; suggested: number }[]>([]);
  const [creatingExpress, setCreatingExpress] = useState(false);
  const [expressCopied, setExpressCopied] = useState(false);
```

- [ ] **Step 3: Add "Enviar pedido" button per supplier group**

In the JSX where each supplier's reposición group is rendered, add after the group header:

```tsx
              <button
                onClick={() => {
                  setExpressSupplier({ id: supplier.id, name: supplier.name, email: supplier.email });
                  setExpressItems(supplierProducts.map(p => ({ product_id: p.id, product_name: p.name, qty: p.suggested_qty, suggested: p.suggested_qty })));
                  setShowExpressModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Enviar pedido
              </button>
```

Add `Send` to the Lucide import.

- [ ] **Step 4: Add express modal JSX + logic**

Add before the closing `</div>` of the component:

```tsx
      {showExpressModal && expressSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg space-y-4 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">Pedido Express</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{expressSupplier.name}</p>
              </div>
              <button onClick={() => setShowExpressModal(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {expressItems.map((item, idx) => (
                <div key={item.product_id} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate">{item.product_name}</span>
                  <input
                    type="number" min="1" value={item.qty}
                    onChange={e => {
                      const next = [...expressItems];
                      next[idx] = { ...item, qty: parseInt(e.target.value) || 1 };
                      setExpressItems(next);
                    }}
                    className="w-16 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-sm text-center bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                disabled={creatingExpress}
                onClick={async () => {
                  setCreatingExpress(true);
                  try {
                    // Create draft OC
                    const res = await fetch('/api/admin/purchase-orders', {
                      method: 'POST', credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        supplier_id: expressSupplier.id,
                        status: 'draft',
                        items: expressItems.map(i => ({ product_id: i.product_id, quantity: i.qty, unit_cost: 0 })),
                      }),
                    });
                    if (!res.ok) throw new Error('Error al crear OC');

                    // Build clipboard text
                    const dateStr = new Date().toLocaleDateString('es-CL');
                    const lines = [
                      `Pedido Tu Farmacia — ${dateStr}`,
                      `Proveedor: ${expressSupplier.name}`,
                      '',
                      ...expressItems.map(i => `- ${i.product_name} — Qty: ${i.qty}`),
                      '',
                      `Total ítems: ${expressItems.length}`,
                    ].join('\n');
                    await navigator.clipboard.writeText(lines);
                    setExpressCopied(true);
                    setTimeout(() => setExpressCopied(false), 3000);
                  } catch (e) {
                    alert(e instanceof Error ? e.message : 'Error');
                  } finally { setCreatingExpress(false); }
                }}
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {expressCopied ? '✓ Copiado al portapapeles' : creatingExpress ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando OC...</> : 'Crear OC + Copiar para WhatsApp'}
              </button>

              {expressSupplier.email && (
                <a
                  href={`mailto:${expressSupplier.email}?subject=Pedido Tu Farmacia — ${new Date().toLocaleDateString('es-CL')}&body=${encodeURIComponent(['Estimados,', '', 'Adjunto detalle de pedido:', '', ...expressItems.map(i => `- ${i.product_name} — Qty: ${i.qty}`), '', 'Saludos,', 'Tu Farmacia'].join('\n'))}`}
                  className="w-full py-2.5 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center"
                >
                  Enviar por email
                </a>
              )}
            </div>
          </div>
        </div>
      )}
```

**Note:** The `purchase-orders` POST API may not support `status: 'draft'` creation directly from the reposicion flow. Check `src/app/api/admin/purchase-orders/route.ts` first. If it only supports `pending`, change `status: 'draft'` to match.

- [ ] **Step 5: Build + commit**

```bash
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
git add pharmacy-ecommerce/apps/web/src/app/admin/reposicion/page.tsx
git commit -m "feat(reposicion): add express supplier order modal with OC creation + clipboard"
```

---

## Task 13: Add libro-recetas to Admin Sidebar Navigation

**Files:**
- Modify: sidebar/nav component (find via `grep -r "libro\|receta\|faltas" src/app/admin/`)

- [ ] **Step 1: Find sidebar component**

```bash
grep -r "faltas\|reposicion" pharmacy-ecommerce/apps/web/src/app/admin/ --include="*.tsx" -l
```

Identify the sidebar/nav file that lists admin menu items.

- [ ] **Step 2: Add libro-recetas entry**

Add a nav item for `/admin/libro-recetas` with `BookOpen` icon, label "Libro Recetas", placed after "Faltas".

- [ ] **Step 3: Build + commit**

```bash
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
git add -A
git commit -m "feat(nav): add Libro Recetas to admin sidebar"
```

---

## Task 14: Deploy

- [ ] **Final build**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

- [ ] **Push**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git push origin main
```

Expected: Vercel auto-deploys. All 4 new cron entries visible in Vercel dashboard.

---

## Self-Review

**Spec coverage check:**
- ✅ P&L del día — Tasks 1 + 2
- ✅ Meta diaria + mensual — Tasks 2 + 3
- ✅ Schema `prescription_records` + `pharmacist_shifts` — Task 4
- ✅ `controlled-substances.ts` — Task 5
- ✅ Prescriptions API — Task 6
- ✅ Libro de recetas page + print — Task 7
- ✅ POS prescription modal (non-skippable) — Task 8
- ✅ Sale API persists prescription records — Task 9
- ✅ Farmacéutico en turno (arqueo) + localStorage — Task 10
- ✅ Daily summary cron + email — Task 11
- ✅ Pedido express proveedor — Task 12
- ✅ Sidebar nav entry — Task 13

**Known risks to address during execution:**
1. Task 11: `db.shift_closes` model name — verify exact Prisma model name in schema before using in cron query
2. Task 12: Verify `POST /api/admin/purchase-orders` accepts `status: 'draft'` and `items` array
3. Task 8: The existing `prescriptionPending` state may have consumers elsewhere in the POS file — search for all usages before replacing
4. Task 4: The `orders` model's `prescription_records` back-relation must be added or Prisma push will fail
