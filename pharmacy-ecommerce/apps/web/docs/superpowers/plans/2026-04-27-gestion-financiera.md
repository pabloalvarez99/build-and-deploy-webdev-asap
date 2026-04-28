# Gestión Financiera ERP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar módulo de Gestión Financiera bajo `/admin/finanzas/*` con Cuentas por Pagar, Gastos, P&L y Cash Flow — acceso owner-only.

**Architecture:** 4 páginas bajo shared layout `/admin/finanzas/layout.tsx`. 4 tablas nuevas + 4 campos en `purchase_orders` vía Prisma schema + `db push`. APIs en `/api/admin/finanzas/*`. Todo protegido con `getOwnerUser()`. No hay test framework — verificación vía `next build`.

**Tech Stack:** Next.js 14 App Router, Prisma 7, PostgreSQL 15 (Cloud SQL), Tailwind CSS 3, TypeScript, Recharts (ya instalado), Lucide icons, `getOwnerUser()` de `@/lib/firebase/api-helpers`.

---

## File Map

**Create:**
- `prisma/schema.prisma` — 4 nuevos models + 4 campos en `purchase_orders`
- `src/app/api/admin/finanzas/ap/route.ts` — GET cuentas por pagar
- `src/app/api/admin/finanzas/ap/[id]/pay/route.ts` — POST registrar pago/abono
- `src/app/api/admin/finanzas/gastos/route.ts` — CRUD gastos + recurrentes
- `src/app/api/admin/finanzas/gastos/[id]/route.ts` — PATCH/DELETE gasto individual
- `src/app/api/admin/finanzas/gastos/recurring/route.ts` — CRUD recurring_expenses
- `src/app/api/admin/finanzas/gastos/recurring/[id]/route.ts` — PATCH/DELETE recurring
- `src/app/api/admin/finanzas/pyl/route.ts` — GET P&L mensual
- `src/app/api/admin/finanzas/cash-flow/route.ts` — GET flujo caja
- `src/app/admin/finanzas/layout.tsx` — sub-nav shared layout
- `src/app/admin/finanzas/page.tsx` — dashboard 4 KPIs
- `src/app/admin/finanzas/cuentas-pagar/page.tsx` — lista OC + estado pago
- `src/app/admin/finanzas/gastos/page.tsx` — CRUD gastos + recurrentes
- `src/app/admin/finanzas/pyl/page.tsx` — P&L mensual + YoY
- `src/app/admin/finanzas/cash-flow/page.tsx` — flujo caja real + proyección

**Modify:**
- `prisma/schema.prisma` — 4 campos en `purchase_orders` + 4 nuevos models
- `src/components/admin/Sidebar.tsx` — agregar link `/admin/finanzas` (owner-only ya cubierto por `canAccessRoute`)
- `src/lib/roles.ts` — ya tiene `/admin/finanzas` en OWNER_ONLY_ROUTES

---

## Task 1: Schema — 4 nuevas tablas + 4 campos en purchase_orders

**Files:**
- Modify: `prisma/schema.prisma`

### Campos a agregar en `purchase_orders` (después de `updated_at`):

```prisma
  paid          Boolean   @default(false)
  paid_at       DateTime? @db.Timestamptz(6)
  payment_method_ap String? @db.VarChar(50)
  due_date      DateTime? @db.Date
  purchase_payments purchase_payments[]
```

### 4 nuevos models (al final del schema):

```prisma
model purchase_payments {
  id                String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  purchase_order_id String          @db.Uuid
  amount            Decimal         @db.Decimal(10, 2)
  payment_method    String          @db.VarChar(50)
  paid_at           DateTime        @db.Timestamptz(6)
  notes             String?
  created_by        String          @db.VarChar(255)
  created_at        DateTime        @default(now()) @db.Timestamptz(6)
  purchase_orders   purchase_orders @relation(fields: [purchase_order_id], references: [id], onDelete: Cascade)

  @@index([purchase_order_id])
  @@index([paid_at(sort: Desc)])
}

model gasto_categories {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name       String   @db.VarChar(100)
  type       String   @default("variable") @db.VarChar(20)
  sort_order Int      @default(0)
  gastos     gastos[]
}

model gastos {
  id                  String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  category_id         String            @db.Uuid
  description         String            @db.VarChar(255)
  amount              Decimal           @db.Decimal(10, 2)
  expense_date        DateTime          @db.Date
  paid_at             DateTime?         @db.Timestamptz(6)
  payment_method      String?           @db.VarChar(50)
  recurring_expense_id String?          @db.Uuid
  created_by          String            @db.VarChar(255)
  created_at          DateTime          @default(now()) @db.Timestamptz(6)
  updated_at          DateTime          @default(now()) @updatedAt @db.Timestamptz(6)
  gasto_categories    gasto_categories  @relation(fields: [category_id], references: [id])
  recurring_expenses  recurring_expenses? @relation(fields: [recurring_expense_id], references: [id], onDelete: SetNull)

  @@index([category_id])
  @@index([expense_date(sort: Desc)])
  @@index([paid_at])
}

model recurring_expenses {
  id           String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  category_id  String           @db.Uuid
  description  String           @db.VarChar(255)
  amount       Decimal          @db.Decimal(10, 2)
  day_of_month Int
  active       Boolean          @default(true)
  created_by   String           @db.VarChar(255)
  created_at   DateTime         @default(now()) @db.Timestamptz(6)
  gasto_categories gasto_categories @relation(fields: [category_id], references: [id])
  gastos       gastos[]

  @@index([active])
}
```

- [ ] **Step 1: Editar `prisma/schema.prisma`**

Agregar 4 campos + relación en model `purchase_orders` después de `updated_at`:

```prisma
  paid               Boolean   @default(false)
  paid_at            DateTime? @db.Timestamptz(6)
  payment_method_ap  String?   @db.VarChar(50)
  due_date           DateTime? @db.Date
  purchase_payments  purchase_payments[]
```

Agregar los 4 models nuevos al final del archivo (antes del EOF).

- [ ] **Step 2: Autorizar IP en Cloud SQL**

```bash
GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
MY_IP=$(curl -s https://api.ipify.org)
echo "Y" | "$GCLOUD" sql instances patch tu-farmacia-db --authorized-networks="$MY_IP/32" --project=tu-farmacia-prod
```

Expected: `Updated [...]`

- [ ] **Step 3: Aplicar schema**

```bash
cd pharmacy-ecommerce/apps/web
DATABASE_URL="postgresql://farmacia:srcmlaYhkEo19YivrG4FDLH0woou@34.39.232.207:5432/farmacia" \
  ./node_modules/.bin/prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 4: Seed gasto_categories**

Ejecutar SQL vía psql o gcloud (después del `db push`, mientras la IP esté autorizada):

```bash
DATABASE_URL="postgresql://farmacia:srcmlaYhkEo19YivrG4FDLH0woou@34.39.232.207:5432/farmacia" \
  ./node_modules/.bin/prisma db execute --stdin <<'SQL'
INSERT INTO gasto_categories (id, name, type, sort_order) VALUES
  (gen_random_uuid(), 'Arriendo', 'fixed', 1),
  (gen_random_uuid(), 'Golan (sistema)', 'fixed', 2),
  (gen_random_uuid(), 'Contador', 'fixed', 3),
  (gen_random_uuid(), 'Sueldos', 'fixed', 4),
  (gen_random_uuid(), 'Luz', 'variable', 5),
  (gen_random_uuid(), 'Agua', 'variable', 6),
  (gen_random_uuid(), 'Internet', 'fixed', 7),
  (gen_random_uuid(), 'Seguros', 'fixed', 8),
  (gen_random_uuid(), 'Marketing', 'variable', 9),
  (gen_random_uuid(), 'Limpieza', 'variable', 10),
  (gen_random_uuid(), 'Otros', 'variable', 99)
ON CONFLICT DO NOTHING;
SQL
```

- [ ] **Step 5: Limpiar IP**

```bash
GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
"$GCLOUD" sql instances patch tu-farmacia-db --clear-authorized-networks --project=tu-farmacia-prod --quiet
```

- [ ] **Step 6: Regenerar Prisma client**

```bash
cd pharmacy-ecommerce/apps/web
DATABASE_URL="postgresql://farmacia:srcmlaYhkEo19YivrG4FDLH0woou@34.39.232.207:5432/farmacia" \
  ./node_modules/.bin/prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 7: Build check**

```bash
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build 2>&1 | tail -20
```

Expected: 0 TypeScript errors.

- [ ] **Step 8: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/prisma/schema.prisma
git commit -m "feat(db): schema finanzas — purchase_payments, gastos, gasto_categories, recurring_expenses"
```

---

## Task 2: Sidebar — agregar link Finanzas

**Files:**
- Modify: `src/components/admin/Sidebar.tsx`

- [ ] **Step 1: Agregar import de `Wallet` de lucide + link Finanzas al navItems**

En `src/components/admin/Sidebar.tsx`, agregar `Wallet` al import de lucide:

```ts
import {
  // ... existing imports ...
  Wallet,
} from 'lucide-react';
```

En el array `navItems`, antes del item de Reportes, agregar:

```ts
  { href: '/admin/finanzas', icon: Wallet, label: 'Finanzas' },
```

El acceso ya está controlado en `roles.ts` — `canAccessRoute` filtra `/admin/finanzas` para owner-only.

- [ ] **Step 2: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build 2>&1 | tail -10
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/components/admin/Sidebar.tsx
git commit -m "feat(sidebar): add Finanzas link (owner-only)"
```

---

## Task 3: Layout + Dashboard Finanzas

**Files:**
- Create: `src/app/admin/finanzas/layout.tsx`
- Create: `src/app/admin/finanzas/page.tsx`
- Create: `src/app/api/admin/finanzas/dashboard/route.ts`

### `src/app/api/admin/finanzas/dashboard/route.ts`

```ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET() {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const db = await getDb();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [
    pendingAP,
    totalAP,
    gastosThisMonth,
    ingresosMes,
    overdueAP,
  ] = await Promise.all([
    // OC pendientes de pago (received, not paid)
    db.purchase_orders.count({ where: { status: 'received', paid: false } }),
    // Monto total OC pendientes
    db.purchase_orders.aggregate({
      where: { status: 'received', paid: false },
      _sum: { total_cost: true },
    }),
    // Gastos del mes en curso
    db.gastos.aggregate({
      where: { expense_date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    // Ingresos del mes (órdenes paid/completed)
    db.orders.aggregate({
      where: {
        status: { in: ['paid', 'completed'] },
        created_at: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { total: true },
    }),
    // OC vencidas (due_date < hoy, no pagadas)
    db.purchase_orders.count({
      where: { status: 'received', paid: false, due_date: { lt: now } },
    }),
  ]);

  return NextResponse.json({
    pending_ap_count: pendingAP,
    pending_ap_amount: totalAP._sum.total_cost ? Number(totalAP._sum.total_cost) : 0,
    gastos_mes: gastosThisMonth._sum.amount ? Number(gastosThisMonth._sum.amount) : 0,
    ingresos_mes: ingresosMes._sum.total ? Number(ingresosMes._sum.total) : 0,
    overdue_ap_count: overdueAP,
  });
}
```

### `src/app/admin/finanzas/layout.tsx`

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, CreditCard, Receipt, TrendingUp, BarChart2 } from 'lucide-react';

const tabs = [
  { href: '/admin/finanzas', label: 'Resumen', icon: Wallet, exact: true },
  { href: '/admin/finanzas/cuentas-pagar', label: 'Cuentas por Pagar', icon: CreditCard },
  { href: '/admin/finanzas/gastos', label: 'Gastos', icon: Receipt },
  { href: '/admin/finanzas/pyl', label: 'P&L', icon: TrendingUp },
  { href: '/admin/finanzas/cash-flow', label: 'Cash Flow', icon: BarChart2 },
];

export default function FinanzasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Sub-nav */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-1 flex gap-1 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
```

### `src/app/admin/finanzas/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Wallet, CreditCard, Receipt, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';

interface DashboardData {
  pending_ap_count: number;
  pending_ap_amount: number;
  gastos_mes: number;
  ingresos_mes: number;
  overdue_ap_count: number;
}

function formatCLP(n: number) {
  return `$${Math.round(n).toLocaleString('es-CL')}`;
}

export default function FinanzasDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/finanzas/dashboard')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const kpis = [
    {
      label: 'OC Pendientes de Pago',
      value: data ? `${data.pending_ap_count} OC` : '-',
      sub: data ? formatCLP(data.pending_ap_amount) : '-',
      icon: CreditCard,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      alert: data && data.overdue_ap_count > 0,
      alertMsg: data ? `${data.overdue_ap_count} vencidas` : '',
    },
    {
      label: 'Gastos del Mes',
      value: data ? formatCLP(data.gastos_mes) : '-',
      sub: 'mes en curso',
      icon: Receipt,
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
    {
      label: 'Ingresos del Mes',
      value: data ? formatCLP(data.ingresos_mes) : '-',
      sub: 'órdenes paid + completed',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Margen Bruto Estimado',
      value: data ? formatCLP(data.ingresos_mes - data.gastos_mes) : '-',
      sub: 'ingresos − gastos',
      icon: Wallet,
      color: data && data.ingresos_mes - data.gastos_mes >= 0 ? 'text-emerald-600' : 'text-red-600',
      bg: 'bg-slate-50 dark:bg-slate-700/50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-emerald-600" />
          Gestión Financiera
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Resumen financiero del mes en curso
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-2">
            <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="text-xs text-slate-400">{kpi.sub}</p>
              {kpi.alert && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3" /> {kpi.alertMsg}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 1: Crear `src/app/api/admin/finanzas/dashboard/route.ts`** con el código arriba.

- [ ] **Step 2: Crear `src/app/admin/finanzas/layout.tsx`** con el código arriba.

- [ ] **Step 3: Crear `src/app/admin/finanzas/page.tsx`** con el código arriba.

- [ ] **Step 4: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build 2>&1 | tail -15
```

- [ ] **Step 5: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add \
  pharmacy-ecommerce/apps/web/src/app/admin/finanzas/layout.tsx \
  pharmacy-ecommerce/apps/web/src/app/admin/finanzas/page.tsx \
  pharmacy-ecommerce/apps/web/src/app/api/admin/finanzas/dashboard/route.ts
git commit -m "feat(finanzas): layout sub-nav + dashboard 4 KPIs"
```

---

## Task 4: Cuentas por Pagar — API

**Files:**
- Create: `src/app/api/admin/finanzas/ap/route.ts`
- Create: `src/app/api/admin/finanzas/ap/[id]/pay/route.ts`

### `src/app/api/admin/finanzas/ap/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

function serialize(po: Record<string, unknown>) {
  return {
    ...po,
    total_cost: po.total_cost != null ? Number(po.total_cost) : null,
    invoice_date: po.invoice_date instanceof Date ? po.invoice_date.toISOString() : po.invoice_date,
    due_date: po.due_date instanceof Date ? po.due_date.toISOString() : po.due_date,
    paid_at: po.paid_at instanceof Date ? po.paid_at.toISOString() : po.paid_at,
    created_at: po.created_at instanceof Date ? po.created_at.toISOString() : po.created_at,
  };
}

export async function GET(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const sp = request.nextUrl.searchParams;
  const paid = sp.get('paid'); // 'true' | 'false' | null
  const page = parseInt(sp.get('page') || '1');
  const limit = parseInt(sp.get('limit') || '20');
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = { status: 'received' };
  if (paid === 'true') where.paid = true;
  if (paid === 'false') where.paid = false;

  const db = await getDb();
  const [orders, total] = await Promise.all([
    db.purchase_orders.findMany({
      where,
      orderBy: [{ paid: 'asc' }, { due_date: 'asc' }, { created_at: 'desc' }],
      skip: offset,
      take: limit,
      include: {
        suppliers: { select: { id: true, name: true } },
        purchase_payments: { orderBy: { paid_at: 'desc' } },
      },
    }),
    db.purchase_orders.count({ where }),
  ]);

  return NextResponse.json({
    orders: orders.map(o => serialize(o as unknown as Record<string, unknown>)),
    total,
    page,
    limit,
  });
}

export async function PATCH(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const { id, due_date } = await request.json();
  if (!id) return errorResponse('id requerido', 400);

  const db = await getDb();
  const updated = await db.purchase_orders.update({
    where: { id },
    data: { due_date: due_date ? new Date(due_date) : null },
  });

  return NextResponse.json(serialize(updated as unknown as Record<string, unknown>));
}
```

### `src/app/api/admin/finanzas/ap/[id]/pay/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const { amount, payment_method, paid_at, notes, mark_fully_paid } = await request.json();

  if (!amount || amount <= 0) return errorResponse('Monto requerido', 400);
  if (!payment_method) return errorResponse('Método de pago requerido', 400);

  const db = await getDb();
  const po = await db.purchase_orders.findUnique({ where: { id: params.id } });
  if (!po) return errorResponse('OC no encontrada', 404);

  await db.$transaction(async (tx) => {
    await tx.purchase_payments.create({
      data: {
        purchase_order_id: params.id,
        amount,
        payment_method,
        paid_at: paid_at ? new Date(paid_at) : new Date(),
        notes: notes || null,
        created_by: owner.email || owner.uid,
      },
    });

    if (mark_fully_paid) {
      await tx.purchase_orders.update({
        where: { id: params.id },
        data: {
          paid: true,
          paid_at: paid_at ? new Date(paid_at) : new Date(),
          payment_method_ap: payment_method,
        },
      });
    }
  });

  const updated = await db.purchase_orders.findUnique({
    where: { id: params.id },
    include: { purchase_payments: { orderBy: { paid_at: 'desc' } } },
  });

  return NextResponse.json({ success: true, order: updated });
}
```

- [ ] **Step 1: Crear directorios y archivos**

```bash
mkdir -p pharmacy-ecommerce/apps/web/src/app/api/admin/finanzas/ap/\[id\]/pay
```

Crear `src/app/api/admin/finanzas/ap/route.ts` con el código arriba.
Crear `src/app/api/admin/finanzas/ap/[id]/pay/route.ts` con el código arriba.

- [ ] **Step 2: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build 2>&1 | tail -15
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/app/api/admin/finanzas/
git commit -m "feat(api): finanzas/ap — GET cuentas pagar + POST registrar pago"
```

---

## Task 5: Cuentas por Pagar — UI

**Files:**
- Create: `src/app/admin/finanzas/cuentas-pagar/page.tsx`

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CreditCard, CheckCircle2, Clock, AlertTriangle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface Payment {
  id: string;
  amount: number;
  payment_method: string;
  paid_at: string;
  notes: string | null;
}

interface PO {
  id: string;
  invoice_number: string | null;
  total_cost: number | null;
  paid: boolean;
  paid_at: string | null;
  payment_method_ap: string | null;
  due_date: string | null;
  created_at: string;
  suppliers: { id: string; name: string };
  purchase_payments: Payment[];
}

function formatCLP(n: number) {
  return `$${Math.round(n).toLocaleString('es-CL')}`;
}

function formatDate(s: string | null) {
  if (!s) return '-';
  return new Date(s).toLocaleDateString('es-CL');
}

function isOverdue(po: PO) {
  if (po.paid || !po.due_date) return false;
  return new Date(po.due_date) < new Date();
}

export default function CuentasPagarPage() {
  const [orders, setOrders] = useState<PO[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'false' | 'true' | ''>('false');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [payModal, setPayModal] = useState<PO | null>(null);
  const [paying, setPaying] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'transferencia', paid_at: '', notes: '', mark_fully_paid: true });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filter) params.set('paid', filter);
    const res = await fetch(`/api/admin/finanzas/ap?${params}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const openPay = (po: PO) => {
    setPayForm({
      amount: po.total_cost ? String(po.total_cost) : '',
      payment_method: 'transferencia',
      paid_at: new Date().toISOString().split('T')[0],
      notes: '',
      mark_fully_paid: true,
    });
    setPayModal(po);
  };

  const submitPay = async () => {
    if (!payModal) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/admin/finanzas/ap/${payModal.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(payForm.amount),
          payment_method: payForm.payment_method,
          paid_at: payForm.paid_at || undefined,
          notes: payForm.notes || undefined,
          mark_fully_paid: payForm.mark_fully_paid,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setPayModal(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-600" />
          Cuentas por Pagar
        </h2>
        <div className="flex gap-2">
          {(['false', 'true', ''] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                filter === f
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {f === 'false' ? 'Pendientes' : f === 'true' ? 'Pagadas' : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          {orders.length === 0 ? (
            <p className="text-sm text-slate-400 p-6 text-center">Sin órdenes de compra en este estado.</p>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {orders.map((po) => {
                const overdue = isOverdue(po);
                const paidAmount = po.purchase_payments.reduce((s, p) => s + Number(p.amount), 0);
                return (
                  <div key={po.id}>
                    <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
                      {/* Status icon */}
                      <div className="shrink-0">
                        {po.paid ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : overdue ? (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {po.suppliers.name}
                          {po.invoice_number && <span className="text-slate-400 ml-2 text-xs">#{po.invoice_number}</span>}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatCLP(po.total_cost || 0)} · Vence: {formatDate(po.due_date)}
                          {overdue && <span className="text-red-500 ml-1">VENCIDA</span>}
                        </p>
                        {paidAmount > 0 && !po.paid && (
                          <p className="text-xs text-emerald-600">Abonado: {formatCLP(paidAmount)}</p>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {!po.paid && (
                          <button
                            onClick={() => openPay(po)}
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                          >
                            Registrar Pago
                          </button>
                        )}
                        {po.purchase_payments.length > 0 && (
                          <button
                            onClick={() => setExpanded(expanded === po.id ? null : po.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            {expanded === po.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Payments list */}
                    {expanded === po.id && po.purchase_payments.length > 0 && (
                      <div className="px-12 pb-3 space-y-1">
                        {po.purchase_payments.map((p) => (
                          <div key={p.id} className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>{formatDate(p.paid_at)} · {p.payment_method}</span>
                            <span className="font-medium text-emerald-600">{formatCLP(Number(p.amount))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Anterior</button>
          <span className="px-3 py-1.5 text-sm text-slate-500">{page} / {Math.ceil(total / 20)}</span>
          <button disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Siguiente</button>
        </div>
      )}

      {/* Pay Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPayModal(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Registrar Pago</h3>
            <p className="text-sm text-slate-500">{payModal.suppliers.name} · Total: {formatCLP(payModal.total_cost || 0)}</p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Monto ($CLP)</label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Método de pago</label>
                <select
                  value={payForm.payment_method}
                  onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="debito">Débito</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Fecha de pago</label>
                <input
                  type="date"
                  value={payForm.paid_at}
                  onChange={e => setPayForm(f => ({ ...f, paid_at: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Notas (opcional)</label>
                <input
                  type="text"
                  value={payForm.notes}
                  onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={payForm.mark_fully_paid}
                  onChange={e => setPayForm(f => ({ ...f, mark_fully_paid: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                Marcar como pagada completamente
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setPayModal(null)} className="flex-1 px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
              <button
                onClick={submitPay}
                disabled={paying || !payForm.amount}
                className="flex-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {paying && <Loader2 className="w-4 h-4 animate-spin" />}
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 1: Crear directorio y archivo**

```bash
mkdir -p pharmacy-ecommerce/apps/web/src/app/admin/finanzas/cuentas-pagar
```

Crear `src/app/admin/finanzas/cuentas-pagar/page.tsx` con el código arriba.

- [ ] **Step 2: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build 2>&1 | tail -15
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/app/admin/finanzas/cuentas-pagar/
git commit -m "feat(finanzas): cuentas-pagar UI — lista OC + registrar pago modal"
```

---

## Task 6: Gastos — API (CRUD + recurrentes)

**Files:**
- Create: `src/app/api/admin/finanzas/gastos/route.ts`
- Create: `src/app/api/admin/finanzas/gastos/[id]/route.ts`
- Create: `src/app/api/admin/finanzas/gastos/recurring/route.ts`
- Create: `src/app/api/admin/finanzas/gastos/recurring/[id]/route.ts`

### `src/app/api/admin/finanzas/gastos/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

function serializeGasto(g: Record<string, unknown>) {
  return {
    ...g,
    amount: g.amount != null ? Number(g.amount) : null,
    expense_date: g.expense_date instanceof Date ? g.expense_date.toISOString().split('T')[0] : g.expense_date,
    paid_at: g.paid_at instanceof Date ? g.paid_at.toISOString() : g.paid_at,
    created_at: g.created_at instanceof Date ? g.created_at.toISOString() : g.created_at,
  };
}

export async function GET(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const sp = request.nextUrl.searchParams;
  const page = parseInt(sp.get('page') || '1');
  const limit = parseInt(sp.get('limit') || '30');
  const month = sp.get('month'); // 'YYYY-MM'
  const category_id = sp.get('category_id') || undefined;
  const offset = (page - 1) * limit;

  const db = await getDb();
  const where: Record<string, unknown> = {};
  if (category_id) where.category_id = category_id;
  if (month) {
    const [y, m] = month.split('-').map(Number);
    where.expense_date = {
      gte: new Date(y, m - 1, 1),
      lte: new Date(y, m, 0),
    };
  }

  const [gastos, total, categories] = await Promise.all([
    db.gastos.findMany({
      where,
      orderBy: { expense_date: 'desc' },
      skip: offset,
      take: limit,
      include: { gasto_categories: true },
    }),
    db.gastos.count({ where }),
    db.gasto_categories.findMany({ orderBy: { sort_order: 'asc' } }),
  ]);

  return NextResponse.json({
    gastos: gastos.map(g => serializeGasto(g as unknown as Record<string, unknown>)),
    total,
    page,
    limit,
    categories,
  });
}

export async function POST(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const body = await request.json();
  const { category_id, description, amount, expense_date, paid_at, payment_method } = body;

  if (!category_id || !description || !amount || !expense_date) {
    return errorResponse('category_id, description, amount, expense_date requeridos', 400);
  }

  const db = await getDb();
  const gasto = await db.gastos.create({
    data: {
      category_id,
      description,
      amount,
      expense_date: new Date(expense_date),
      paid_at: paid_at ? new Date(paid_at) : null,
      payment_method: payment_method || null,
      created_by: owner.email || owner.uid,
    },
    include: { gasto_categories: true },
  });

  return NextResponse.json(serializeGasto(gasto as unknown as Record<string, unknown>), { status: 201 });
}
```

### `src/app/api/admin/finanzas/gastos/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

function serializeGasto(g: Record<string, unknown>) {
  return {
    ...g,
    amount: g.amount != null ? Number(g.amount) : null,
    expense_date: g.expense_date instanceof Date ? g.expense_date.toISOString().split('T')[0] : g.expense_date,
    paid_at: g.paid_at instanceof Date ? g.paid_at.toISOString() : g.paid_at,
    updated_at: g.updated_at instanceof Date ? g.updated_at.toISOString() : g.updated_at,
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const body = await request.json();
  const { category_id, description, amount, expense_date, paid_at, payment_method } = body;

  const db = await getDb();
  const updated = await db.gastos.update({
    where: { id: params.id },
    data: {
      ...(category_id && { category_id }),
      ...(description && { description }),
      ...(amount !== undefined && { amount }),
      ...(expense_date && { expense_date: new Date(expense_date) }),
      ...('paid_at' in body && { paid_at: body.paid_at ? new Date(body.paid_at) : null }),
      ...('payment_method' in body && { payment_method: body.payment_method || null }),
    },
    include: { gasto_categories: true },
  });

  return NextResponse.json(serializeGasto(updated as unknown as Record<string, unknown>));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const db = await getDb();
  await db.gastos.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
```

### `src/app/api/admin/finanzas/gastos/recurring/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET() {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const db = await getDb();
  const [recurring, categories] = await Promise.all([
    db.recurring_expenses.findMany({
      orderBy: { created_at: 'desc' },
      include: { gasto_categories: true },
    }),
    db.gasto_categories.findMany({ orderBy: { sort_order: 'asc' } }),
  ]);

  return NextResponse.json({ recurring, categories });
}

export async function POST(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const { category_id, description, amount, day_of_month } = await request.json();
  if (!category_id || !description || !amount || !day_of_month) {
    return errorResponse('category_id, description, amount, day_of_month requeridos', 400);
  }
  if (day_of_month < 1 || day_of_month > 28) {
    return errorResponse('day_of_month debe ser entre 1 y 28', 400);
  }

  const db = await getDb();
  const rec = await db.recurring_expenses.create({
    data: { category_id, description, amount, day_of_month, created_by: owner.email || owner.uid },
    include: { gasto_categories: true },
  });

  return NextResponse.json(rec, { status: 201 });
}
```

### `src/app/api/admin/finanzas/gastos/recurring/[id]/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const body = await request.json();
  const db = await getDb();
  const updated = await db.recurring_expenses.update({
    where: { id: params.id },
    data: {
      ...(body.description && { description: body.description }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.day_of_month && { day_of_month: body.day_of_month }),
      ...(body.active !== undefined && { active: body.active }),
      ...(body.category_id && { category_id: body.category_id }),
    },
    include: { gasto_categories: true },
  });
  return NextResponse.json(updated);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Generate gasto for this month from recurring template
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const db = await getDb();
  const rec = await db.recurring_expenses.findUnique({ where: { id: params.id } });
  if (!rec) return errorResponse('Plantilla no encontrada', 404);

  const now = new Date();
  const expenseDate = new Date(now.getFullYear(), now.getMonth(), rec.day_of_month);

  const gasto = await db.gastos.create({
    data: {
      category_id: rec.category_id,
      description: rec.description,
      amount: rec.amount,
      expense_date: expenseDate,
      recurring_expense_id: rec.id,
      created_by: owner.email || owner.uid,
    },
    include: { gasto_categories: true },
  });

  return NextResponse.json(gasto, { status: 201 });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const db = await getDb();
  await db.recurring_expenses.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
```

- [ ] **Step 1: Crear directorios**

```bash
mkdir -p pharmacy-ecommerce/apps/web/src/app/api/admin/finanzas/gastos/\[id\]
mkdir -p pharmacy-ecommerce/apps/web/src/app/api/admin/finanzas/gastos/recurring/\[id\]
```

- [ ] **Step 2: Crear los 4 archivos de API** con el código de cada sección arriba.

- [ ] **Step 3: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build 2>&1 | tail -15
```

- [ ] **Step 4: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/app/api/admin/finanzas/gastos/
git commit -m "feat(api): finanzas/gastos — CRUD gastos + recurring templates"
```

---

## Task 7: Gastos — UI

**Files:**
- Create: `src/app/admin/finanzas/gastos/page.tsx`

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Receipt, Plus, Trash2, RotateCcw, Loader2, X, RefreshCw, ChevronDown } from 'lucide-react';

interface Category { id: string; name: string; type: string; sort_order: number; }
interface Gasto {
  id: string;
  category_id: string;
  description: string;
  amount: number;
  expense_date: string;
  paid_at: string | null;
  payment_method: string | null;
  gasto_categories: Category;
}
interface Recurring {
  id: string;
  category_id: string;
  description: string;
  amount: number;
  day_of_month: number;
  active: boolean;
  gasto_categories: Category;
}

function formatCLP(n: number) { return `$${Math.round(n).toLocaleString('es-CL')}`; }
function thisMonth() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; }

const PAYMENT_METHODS = ['transferencia','efectivo','cheque','debito','credito'];

export default function GastosPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recurring, setRecurring] = useState<Recurring[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [month, setMonth] = useState(thisMonth());
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'gastos' | 'recurrentes'>('gastos');
  const [showForm, setShowForm] = useState(false);
  const [showRecForm, setShowRecForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);

  const [form, setForm] = useState({ category_id: '', description: '', amount: '', expense_date: '', payment_method: 'transferencia' });
  const [recForm, setRecForm] = useState({ category_id: '', description: '', amount: '', day_of_month: '1' });

  const loadGastos = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '30', month });
    const res = await fetch(`/api/admin/finanzas/gastos?${params}`);
    const data = await res.json();
    setGastos(data.gastos || []);
    setTotal(data.total || 0);
    setCategories(data.categories || []);
    setLoading(false);
  }, [page, month]);

  const loadRecurring = useCallback(async () => {
    const res = await fetch('/api/admin/finanzas/gastos/recurring');
    const data = await res.json();
    setRecurring(data.recurring || []);
    if (data.categories?.length) setCategories(data.categories);
  }, []);

  useEffect(() => { loadGastos(); }, [loadGastos]);
  useEffect(() => { loadRecurring(); }, [loadRecurring]);

  const deleteGasto = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return;
    await fetch(`/api/admin/finanzas/gastos/${id}`, { method: 'DELETE' });
    loadGastos();
  };

  const generateFromRecurring = async (id: string) => {
    setGenerating(id);
    const res = await fetch(`/api/admin/finanzas/gastos/recurring/${id}`, { method: 'POST' });
    if (!res.ok) { const d = await res.json(); alert(d.error || 'Error'); }
    else { loadGastos(); }
    setGenerating(null);
  };

  const deleteRecurring = async (id: string) => {
    if (!confirm('¿Eliminar plantilla recurrente?')) return;
    await fetch(`/api/admin/finanzas/gastos/recurring/${id}`, { method: 'DELETE' });
    loadRecurring();
  };

  const submitGasto = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/finanzas/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowForm(false);
      setForm({ category_id: '', description: '', amount: '', expense_date: '', payment_method: 'transferencia' });
      loadGastos();
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  };

  const submitRecurring = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/finanzas/gastos/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...recForm, amount: parseFloat(recForm.amount), day_of_month: parseInt(recForm.day_of_month) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setShowRecForm(false);
      setRecForm({ category_id: '', description: '', amount: '', day_of_month: '1' });
      loadRecurring();
    } catch (e) { alert(e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  };

  const totalMes = gastos.reduce((s, g) => s + g.amount, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-emerald-600" />
          Gastos
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => tab === 'gastos' ? setShowForm(true) : setShowRecForm(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {tab === 'gastos' ? 'Nuevo Gasto' : 'Nueva Plantilla'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['gastos', 'recurrentes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm rounded-xl font-medium transition-colors ${tab === t ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
            {t === 'gastos' ? 'Gastos' : 'Recurrentes'}
          </button>
        ))}
      </div>

      {tab === 'gastos' && (
        <>
          {/* Month filter + summary */}
          <div className="flex items-center gap-3 flex-wrap">
            <input type="month" value={month} onChange={e => { setMonth(e.target.value); setPage(1); }} className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            {!loading && <span className="text-sm text-slate-500">Total mes: <strong className="text-red-600">{formatCLP(totalMes)}</strong></span>}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              {gastos.length === 0 ? (
                <p className="text-sm text-slate-400 p-6 text-center">Sin gastos para este mes.</p>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-700">
                  {gastos.map(g => (
                    <div key={g.id} className="flex items-center justify-between px-4 py-3 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{g.description}</p>
                        <p className="text-xs text-slate-500">{g.gasto_categories.name} · {new Date(g.expense_date + 'T12:00:00').toLocaleDateString('es-CL')}</p>
                      </div>
                      <p className="text-sm font-bold text-red-600 shrink-0">{formatCLP(g.amount)}</p>
                      <button onClick={() => deleteGasto(g.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {total > 30 && (
            <div className="flex justify-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Anterior</button>
              <span className="px-3 py-1.5 text-sm text-slate-500">{page} / {Math.ceil(total/30)}</span>
              <button disabled={page >= Math.ceil(total/30)} onClick={() => setPage(p => p+1)} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40">Siguiente</button>
            </div>
          )}
        </>
      )}

      {tab === 'recurrentes' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
          {recurring.length === 0 ? (
            <p className="text-sm text-slate-400 p-6 text-center">Sin plantillas recurrentes. Crea una para auto-generar gastos fijos cada mes.</p>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {recurring.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{r.description}</p>
                    <p className="text-xs text-slate-500">{r.gasto_categories.name} · día {r.day_of_month} de cada mes</p>
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 shrink-0">{formatCLP(r.amount)}</p>
                  <button
                    onClick={() => generateFromRecurring(r.id)}
                    disabled={generating === r.id}
                    className="p-1.5 text-emerald-500 hover:text-emerald-700 transition-colors shrink-0"
                    title="Generar gasto este mes"
                  >
                    {generating === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteRecurring(r.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Gasto Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Nuevo Gasto</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Categoría</label>
                <select value={form.category_id} onChange={e => setForm(f => ({...f, category_id: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Seleccionar...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Descripción</label>
                <input type="text" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Monto ($CLP)</label>
                <input type="number" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Fecha del gasto</label>
                <input type="date" value={form.expense_date} onChange={e => setForm(f => ({...f, expense_date: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Método de pago</label>
                <select value={form.payment_method} onChange={e => setForm(f => ({...f, payment_method: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={submitGasto} disabled={saving || !form.category_id || !form.description || !form.amount || !form.expense_date} className="flex-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Recurring Modal */}
      {showRecForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowRecForm(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Nueva Plantilla Recurrente</h3>
              <button onClick={() => setShowRecForm(false)} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Categoría</label>
                <select value={recForm.category_id} onChange={e => setRecForm(f => ({...f, category_id: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">Seleccionar...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Descripción</label>
                <input type="text" value={recForm.description} onChange={e => setRecForm(f => ({...f, description: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Monto mensual ($CLP)</label>
                <input type="number" value={recForm.amount} onChange={e => setRecForm(f => ({...f, amount: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Día del mes (1-28)</label>
                <input type="number" min={1} max={28} value={recForm.day_of_month} onChange={e => setRecForm(f => ({...f, day_of_month: e.target.value}))} className="w-full mt-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowRecForm(false)} className="flex-1 px-4 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
              <button onClick={submitRecurring} disabled={saving || !recForm.category_id || !recForm.description || !recForm.amount} className="flex-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Crear Plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 1: Crear directorio y archivo**

```bash
mkdir -p pharmacy-ecommerce/apps/web/src/app/admin/finanzas/gastos
```

Crear `src/app/admin/finanzas/gastos/page.tsx` con el código arriba.

- [ ] **Step 2: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build 2>&1 | tail -15
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/app/admin/finanzas/gastos/
git commit -m "feat(finanzas): gastos UI — CRUD + plantillas recurrentes"
```

---

## Task 8: P&L — API + UI

**Files:**
- Create: `src/app/api/admin/finanzas/pyl/route.ts`
- Create: `src/app/admin/finanzas/pyl/page.tsx`

### `src/app/api/admin/finanzas/pyl/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

export async function GET(request: NextRequest) {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const sp = request.nextUrl.searchParams;
  const year = parseInt(sp.get('year') || String(new Date().getFullYear()));

  const db = await getDb();

  // Build 12 months for the year
  const months = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(year, i, 1);
    const end = new Date(year, i + 1, 0, 23, 59, 59, 999);
    return { month: i + 1, start, end };
  });

  // Previous year for YoY
  const prevMonths = months.map(m => ({
    month: m.month,
    start: new Date(year - 1, m.month - 1, 1),
    end: new Date(year - 1, m.month, 0, 23, 59, 59, 999),
  }));

  const [ingresosCurrent, ingresosprev, gastosCurrent, gastosPrev] = await Promise.all([
    db.orders.groupBy({
      by: [],
      where: { status: { in: ['paid', 'completed'] }, created_at: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      _sum: { total: true },
    }),
    db.orders.groupBy({
      by: [],
      where: { status: { in: ['paid', 'completed'] }, created_at: { gte: new Date(year - 1, 0, 1), lt: new Date(year, 0, 1) } },
      _sum: { total: true },
    }),
    db.gastos.groupBy({
      by: [],
      where: { expense_date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      _sum: { amount: true },
    }),
    db.gastos.groupBy({
      by: [],
      where: { expense_date: { gte: new Date(year - 1, 0, 1), lt: new Date(year, 0, 1) } },
      _sum: { amount: true },
    }),
  ]);

  // Monthly breakdown — run raw queries for efficiency
  const monthlyData = await Promise.all(
    months.map(async ({ month, start, end }) => {
      const prevM = prevMonths.find(p => p.month === month)!;

      const [ingCur, ingPrev, gastoCur, gastoPrev] = await Promise.all([
        db.orders.aggregate({
          where: { status: { in: ['paid', 'completed'] }, created_at: { gte: start, lte: end } },
          _sum: { total: true },
        }),
        db.orders.aggregate({
          where: { status: { in: ['paid', 'completed'] }, created_at: { gte: prevM.start, lte: prevM.end } },
          _sum: { total: true },
        }),
        db.gastos.aggregate({
          where: { expense_date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        db.gastos.aggregate({
          where: { expense_date: { gte: prevM.start, lte: prevM.end } },
          _sum: { amount: true },
        }),
      ]);

      const ingresos = Number(ingCur._sum.total || 0);
      const gastos = Number(gastoCur._sum.amount || 0);
      const ingresosPrev = Number(ingPrev._sum.total || 0);
      const gastosPrevM = Number(gastoPrev._sum.amount || 0);

      return {
        month,
        ingresos,
        gastos,
        margen: ingresos - gastos,
        ingresos_prev: ingresosPrev,
        gastos_prev: gastosPrevM,
        margen_prev: ingresosPrev - gastosPrevM,
      };
    })
  );

  // YTD
  const now = new Date();
  const ytdMonths = year === now.getFullYear() ? monthlyData.slice(0, now.getMonth() + 1) : monthlyData;
  const ytd = {
    ingresos: ytdMonths.reduce((s, m) => s + m.ingresos, 0),
    gastos: ytdMonths.reduce((s, m) => s + m.gastos, 0),
    margen: ytdMonths.reduce((s, m) => s + m.margen, 0),
  };

  return NextResponse.json({ year, months: monthlyData, ytd });
}
```

### `src/app/admin/finanzas/pyl/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MonthData {
  month: number;
  ingresos: number;
  gastos: number;
  margen: number;
  ingresos_prev: number;
  gastos_prev: number;
  margen_prev: number;
}
interface PylData {
  year: number;
  months: MonthData[];
  ytd: { ingresos: number; gastos: number; margen: number };
}

const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
function formatCLP(n: number) { return `$${Math.round(n).toLocaleString('es-CL')}`; }
function pct(cur: number, prev: number) {
  if (!prev) return null;
  const d = ((cur - prev) / Math.abs(prev)) * 100;
  return (d >= 0 ? '+' : '') + d.toFixed(1) + '%';
}

export default function PylPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<PylData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/finanzas/pyl?year=${year}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [year]);

  const chartData = data?.months.map(m => ({
    name: MONTH_NAMES[m.month - 1],
    Ingresos: m.ingresos,
    Gastos: m.gastos,
    Margen: m.margen,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          P&L — {year}
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200 w-12 text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} disabled={year >= new Date().getFullYear()} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : data && (
        <>
          {/* YTD Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Ingresos YTD', value: data.ytd.ingresos, color: 'text-emerald-600' },
              { label: 'Gastos YTD', value: data.ytd.gastos, color: 'text-red-600' },
              { label: 'Margen YTD', value: data.ytd.margen, color: data.ytd.margen >= 0 ? 'text-emerald-600' : 'text-red-600' },
            ].map(k => (
              <div key={k.label} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">{k.label}</p>
                <p className={`text-xl font-bold ${k.color}`}>{formatCLP(k.value)}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: number) => formatCLP(v)} />
                <Legend />
                <Bar dataKey="Ingresos" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="Gastos" fill="#ef4444" radius={[4,4,0,0]} />
                <Bar dataKey="Margen" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Mes</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Ingresos</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">YoY</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Gastos</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">Margen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {data.months.map(m => {
                    const yoy = pct(m.ingresos, m.ingresos_prev);
                    return (
                      <tr key={m.month} className={m.ingresos === 0 ? 'opacity-40' : ''}>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{MONTH_NAMES[m.month-1]}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatCLP(m.ingresos)}</td>
                        <td className={`px-4 py-3 text-right text-xs ${yoy && yoy.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{yoy || '-'}</td>
                        <td className="px-4 py-3 text-right text-red-500">{formatCLP(m.gastos)}</td>
                        <td className={`px-4 py-3 text-right font-bold ${m.margen >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCLP(m.margen)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 1: Crear directorios y archivos**

```bash
mkdir -p pharmacy-ecommerce/apps/web/src/app/api/admin/finanzas/pyl
mkdir -p pharmacy-ecommerce/apps/web/src/app/admin/finanzas/pyl
```

Crear `src/app/api/admin/finanzas/pyl/route.ts` con el código arriba.
Crear `src/app/admin/finanzas/pyl/page.tsx` con el código arriba.

- [ ] **Step 2: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build 2>&1 | tail -15
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/app/api/admin/finanzas/pyl/ \
         pharmacy-ecommerce/apps/web/src/app/admin/finanzas/pyl/
git commit -m "feat(finanzas): P&L mensual + YoY + chart Recharts"
```

---

## Task 9: Cash Flow — API + UI

**Files:**
- Create: `src/app/api/admin/finanzas/cash-flow/route.ts`
- Create: `src/app/admin/finanzas/cash-flow/page.tsx`

### `src/app/api/admin/finanzas/cash-flow/route.ts`

```ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getOwnerUser, errorResponse } from '@/lib/firebase/api-helpers';

function dateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

export async function GET() {
  const owner = await getOwnerUser();
  if (!owner) return errorResponse('Unauthorized', 403);

  const db = await getDb();
  const now = new Date();
  const past30 = new Date(now);
  past30.setDate(past30.getDate() - 30);
  const future30 = new Date(now);
  future30.setDate(future30.getDate() + 30);

  // REAL: ingresos pasados (órdenes paid/completed)
  const ingresosReal = await db.orders.findMany({
    where: {
      status: { in: ['paid', 'completed'] },
      created_at: { gte: past30, lte: now },
    },
    select: { created_at: true, total: true },
  });

  // REAL: pagos a proveedores pasados
  const pagosReal = await db.purchase_payments.findMany({
    where: { paid_at: { gte: past30, lte: now } },
    select: { paid_at: true, amount: true },
  });

  // REAL: gastos pagados pasados
  const gastosReal = await db.gastos.findMany({
    where: { paid_at: { gte: past30, lte: now } },
    select: { paid_at: true, amount: true },
  });

  // PROJECTED: OC recibidas no pagadas con due_date en próximos 30 días
  const ocProjected = await db.purchase_orders.findMany({
    where: {
      status: 'received',
      paid: false,
      due_date: { gte: now, lte: future30 },
    },
    select: { due_date: true, total_cost: true },
  });

  // PROJECTED: gastos recurrentes activos → generar fechas en próximos 30 días
  const recurring = await db.recurring_expenses.findMany({
    where: { active: true },
    select: { day_of_month: true, amount: true, description: true },
  });

  // Build daily map
  type DayEntry = { date: string; inflow: number; outflow: number; projected_outflow: number };
  const map = new Map<string, DayEntry>();

  const getDay = (date: string): DayEntry => {
    if (!map.has(date)) map.set(date, { date, inflow: 0, outflow: 0, projected_outflow: 0 });
    return map.get(date)!;
  };

  ingresosReal.forEach(o => {
    const d = getDay(dateKey(o.created_at));
    d.inflow += Number(o.total);
  });

  pagosReal.forEach(p => {
    const d = getDay(dateKey(p.paid_at));
    d.outflow += Number(p.amount);
  });

  gastosReal.forEach(g => {
    const d = getDay(dateKey(g.paid_at!));
    d.outflow += Number(g.amount);
  });

  ocProjected.forEach(oc => {
    if (!oc.due_date || !oc.total_cost) return;
    const d = getDay(dateKey(oc.due_date));
    d.projected_outflow += Number(oc.total_cost);
  });

  // Recurring: next occurrence in 30 days
  recurring.forEach(r => {
    for (let m = 0; m <= 1; m++) {
      const date = new Date(now.getFullYear(), now.getMonth() + m, r.day_of_month);
      if (date >= now && date <= future30) {
        const d = getDay(dateKey(date));
        d.projected_outflow += Number(r.amount);
      }
    }
  });

  // Fill missing days in past 30 + future 30
  const allDays: DayEntry[] = [];
  for (let i = -30; i <= 30; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const key = dateKey(d);
    allDays.push(map.get(key) || { date: key, inflow: 0, outflow: 0, projected_outflow: 0 });
  }

  // Running balance (real only for past, projected for future)
  let balance = 0;
  const result = allDays.map(day => {
    const isPast = new Date(day.date) <= now;
    if (isPast) {
      balance += day.inflow - day.outflow;
    } else {
      balance -= day.projected_outflow;
    }
    return { ...day, balance, is_past: isPast };
  });

  return NextResponse.json({ days: result });
}
```

### `src/app/admin/finanzas/cash-flow/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { BarChart2, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

interface DayEntry {
  date: string;
  inflow: number;
  outflow: number;
  projected_outflow: number;
  balance: number;
  is_past: boolean;
}

function formatCLP(n: number) { return `$${Math.round(n).toLocaleString('es-CL')}`; }
function shortDate(s: string) {
  const d = new Date(s + 'T12:00:00');
  return `${d.getDate()}/${d.getMonth()+1}`;
}

export default function CashFlowPage() {
  const [days, setDays] = useState<DayEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/finanzas/cash-flow')
      .then(r => r.json())
      .then(d => setDays(d.days || []))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = days.find(d => d.date === today);

  const chartData = days
    .filter((_, i) => i % 2 === 0) // Show every other day for readability
    .map(d => ({
      name: shortDate(d.date),
      Balance: d.balance,
      Ingresos: d.is_past ? d.inflow : 0,
      Proyectado: !d.is_past ? -d.projected_outflow : 0,
      is_past: d.is_past,
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-emerald-600" />
          Cash Flow — 30 días pasados + 30 días proyección
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500">Balance acumulado hoy</p>
              <p className={`text-xl font-bold ${(todayEntry?.balance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCLP(todayEntry?.balance || 0)}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500">Ingresos 30d reales</p>
              <p className="text-xl font-bold text-emerald-600">{formatCLP(days.filter(d => d.is_past).reduce((s, d) => s + d.inflow, 0))}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
              <p className="text-xs text-slate-500">Salidas proyectadas 30d</p>
              <p className="text-xl font-bold text-red-600">{formatCLP(days.filter(d => !d.is_past).reduce((s, d) => s + d.projected_outflow, 0))}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Balance acumulado (real + proyectado)</p>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: number) => formatCLP(v)} />
                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 2" />
                <Area type="monotone" dataKey="Balance" stroke="#10b981" fill="url(#balGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-slate-400 mt-2">Línea discontinua roja = zona de saldo negativo. Datos pasados: reales. Futuros: OC vencimiento + gastos recurrentes.</p>
          </div>

          {/* Next outflows */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Próximas salidas proyectadas</h3>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700 max-h-64 overflow-y-auto">
              {days.filter(d => !d.is_past && d.projected_outflow > 0).map(d => (
                <div key={d.date} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{new Date(d.date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="text-sm font-medium text-red-600">{formatCLP(d.projected_outflow)}</span>
                </div>
              ))}
              {days.filter(d => !d.is_past && d.projected_outflow > 0).length === 0 && (
                <p className="text-sm text-slate-400 p-4 text-center">Sin salidas proyectadas en los próximos 30 días.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 1: Crear directorios y archivos**

```bash
mkdir -p pharmacy-ecommerce/apps/web/src/app/api/admin/finanzas/cash-flow
mkdir -p pharmacy-ecommerce/apps/web/src/app/admin/finanzas/cash-flow
```

Crear `src/app/api/admin/finanzas/cash-flow/route.ts` con el código arriba.
Crear `src/app/admin/finanzas/cash-flow/page.tsx` con el código arriba.

- [ ] **Step 2: Build check**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build 2>&1 | tail -15
```

- [ ] **Step 3: Commit**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/apps/web/src/app/api/admin/finanzas/cash-flow/ \
         pharmacy-ecommerce/apps/web/src/app/admin/finanzas/cash-flow/
git commit -m "feat(finanzas): cash-flow 60d — real pasado + proyección futura"
```

---

## Task 10: Build final + Push + Bitácora

- [ ] **Step 1: Build final limpio**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build 2>&1 | tail -20
```

Expected: 0 TypeScript errors, todas las páginas generadas.

- [ ] **Step 2: Push → auto-deploy Vercel**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git push origin main
```

- [ ] **Step 3: Actualizar bitácora**

En `pharmacy-ecommerce/bitacora.md`, al inicio del archivo agregar:

```markdown
## 2026-04-27 — Feat: Módulo Gestión Financiera

- **Schema**: 4 tablas nuevas (`purchase_payments`, `gasto_categories`, `gastos`, `recurring_expenses`) + 4 campos en `purchase_orders` (`paid`, `paid_at`, `payment_method_ap`, `due_date`).
- **Seed**: 11 categorías fijas de gastos.
- **Cuentas por Pagar** (`/admin/finanzas/cuentas-pagar`): lista OC received con estado pago, vencimiento, abonos parciales. Modal para registrar pagos.
- **Gastos** (`/admin/finanzas/gastos`): CRUD gastos + plantillas recurrentes (generar gasto del mes con un clic).
- **P&L** (`/admin/finanzas/pyl`): mensual + YoY + YTD. Bar chart con Recharts.
- **Cash Flow** (`/admin/finanzas/cash-flow`): 30d reales (ingresos + pagos) + 30d proyección (OC vencimiento + recurrentes). Area chart.
- **Acceso**: owner-only (`getOwnerUser()`). Sidebar filtra `/admin/finanzas` para owner.

---
```

- [ ] **Step 4: Commit bitácora + push**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git add pharmacy-ecommerce/bitacora.md
git commit -m "docs: update bitacora with gestion-financiera feature"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ `/admin/finanzas` dashboard 4 KPIs
- ✅ `/admin/finanzas/cuentas-pagar` — lista OC received + estado + marcar pagadas + abonos
- ✅ `/admin/finanzas/gastos` — CRUD + recurrentes
- ✅ `/admin/finanzas/pyl` — mensual + YoY + YTD + acumulado
- ✅ `/admin/finanzas/cash-flow` — 30d reales + 30d proyección
- ✅ Acceso owner-only en todas las rutas y APIs
- ✅ 4 tablas nuevas + 4 campos purchase_orders
- ✅ Seed 11 categorías gasto_categories
- ✅ Base devengada: expense_date para gastos, created_at para órdenes
- ✅ Sidebar link Finanzas
- ✅ `/admin/finanzas` ya en OWNER_ONLY_ROUTES en roles.ts

**Placeholder scan:** Ninguno. Todos los steps tienen código exacto.

**Type consistency:**
- `serializeGasto` definida en gastos/route.ts, también en gastos/[id]/route.ts (duplicada intencionalmente por separación de archivos — DRY no aplica entre route files)
- `DayEntry` definida en cash-flow API y usada por name match en UI
- `MonthData` definida en pyl/page.tsx, estructura coincide con lo que devuelve la API
- `purchase_payments` relation name en Prisma: `purchase_payments` (plural, snake_case) — usado consistentemente en AP API

**Gaps potenciales:**
- El `recurring/[id]/route.ts` implementa `POST` (generar gasto) y `PATCH` (editar) en el mismo file — Next.js maneja métodos HTTP por separado, OK.
- P&L usa 12 awaits en parallel dentro de Promise.all → potencialmente 24 queries en total. En prod con conexión pooled esto es aceptable para esta escala.
- Cash Flow balance acumulado asume saldo inicial 0 — suficiente para propósito de flujo relativo (no pretende ser contabilidad completa).
