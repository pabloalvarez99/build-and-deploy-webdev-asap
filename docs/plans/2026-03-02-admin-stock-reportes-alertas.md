# Admin: Stock Management, Reports & Alerts — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add editable stock with audit trail, a real reports page with order_items data, and configurable email alerts for low stock.

**Architecture:** Three independent features wired together at the orders API layer. DB migrations first (unblocks everything), then stock UI, then reports, then email alerts + settings. No new dependencies except `resend`.

**Tech Stack:** Next.js 14.1 App Router, TypeScript, Supabase (service role client), Tailwind CSS, Resend (email), Recharts (already installed for charts).

---

## Pre-flight: Key Files to Know

- API helper pattern: `src/lib/supabase/api-helpers.ts` exports `getAdminUser()`, `getServiceClient()`, `errorResponse()`
- Admin layout: `src/app/admin/layout.tsx` — loads criticalStock count, passes to Sidebar
- Sidebar: `src/components/admin/Sidebar.tsx` — already has `criticalStock` badge wired up, uses prop from layout
- Orders approval: `src/app/api/admin/orders/[id]/route.ts` — `approveReservation()` calls `decrement_stock` RPC
- Products page: `src/app/admin/productos/page.tsx` — large file, stock column in table to modify
- Build command: `./node_modules/.bin/next build` from `pharmacy-ecommerce/apps/web/`

---

## Task 1: DB Migration — stock_movements table

**Files:**
- No file to create — run SQL directly in Supabase dashboard

**Step 1: Run this SQL in Supabase SQL Editor (project: jvagvjwrjiekaafpjbit)**

```sql
-- Stock movement audit trail
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL DEFAULT 'correccion',
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_stock_movements" ON stock_movements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_created_at ON stock_movements(created_at DESC);
```

**Step 2: Verify**
Run `SELECT * FROM stock_movements LIMIT 1;` — should return empty set without error.

---

## Task 2: DB Migration — admin_settings table

**Step 1: Run this SQL in Supabase SQL Editor**

```sql
CREATE TABLE IF NOT EXISTS admin_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_admin_settings" ON admin_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Seed defaults
INSERT INTO admin_settings (key, value) VALUES
  ('low_stock_threshold', '10'),
  ('alert_email', 'admin@pharmacy.com')
ON CONFLICT (key) DO NOTHING;
```

**Step 2: Verify**
Run `SELECT * FROM admin_settings;` — should return 2 rows.

**Step 3: Commit note** (no files changed, just memo)
```bash
cd pharmacy-ecommerce/apps/web
git commit --allow-empty -m "chore: DB migrations - stock_movements and admin_settings tables"
```

---

## Task 3: Stock API Endpoint

**Files:**
- Create: `src/app/api/admin/products/[id]/stock/route.ts`

**Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const body = await request.json();
    const { delta, reason } = body as { delta: number; reason: string };

    if (typeof delta !== 'number' || delta === 0) {
      return errorResponse('delta must be a non-zero number');
    }
    const validReasons = ['reposicion', 'correccion', 'merma', 'inventario'];
    if (!validReasons.includes(reason)) {
      return errorResponse(`reason must be one of: ${validReasons.join(', ')}`);
    }

    const supabase = getServiceClient();

    // 1. Get current stock
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, stock')
      .eq('id', id)
      .single();

    if (fetchError || !product) return errorResponse('Product not found', 404);

    const newStock = product.stock + delta;
    if (newStock < 0) return errorResponse('Stock no puede ser negativo', 400);

    // 2. Update stock
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', id)
      .select('id, name, stock')
      .single();

    if (updateError) return errorResponse(updateError.message, 500);

    // 3. Record movement
    await supabase.from('stock_movements').insert({
      product_id: id,
      delta,
      reason,
      admin_id: admin.id,
    });

    return NextResponse.json({ success: true, stock: updated.stock });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { id } = await params;
    const supabase = getServiceClient();

    const { data, error } = await supabase
      .from('stock_movements')
      .select(`
        id, delta, reason, created_at,
        profiles:admin_id ( name, email )
      `)
      .eq('product_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return errorResponse(error.message, 500);
    return NextResponse.json(data || []);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
```

**Step 2: Build check**
```bash
cd pharmacy-ecommerce/apps/web
./node_modules/.bin/next build 2>&1 | grep -E "error TS|Type error|Failed"
```
Expected: no output (no errors).

**Step 3: Commit**
```bash
git add src/app/api/admin/products/[id]/stock/route.ts
git commit -m "feat: stock management API - PATCH delta + GET history"
```

---

## Task 4: StockModal Component

**Files:**
- Create: `src/components/admin/StockModal.tsx`

**Step 1: Create the component**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Clock, AlertCircle } from 'lucide-react';

interface Movement {
  id: string;
  delta: number;
  reason: string;
  created_at: string;
  profiles: { name: string | null; email: string } | null;
}

interface StockModalProps {
  productId: string;
  productName: string;
  currentStock: number;
  onClose: () => void;
  onStockUpdated: (productId: string, newStock: number) => void;
}

const REASONS = [
  { value: 'reposicion', label: 'Reposición de stock' },
  { value: 'correccion', label: 'Corrección de inventario' },
  { value: 'merma', label: 'Merma / pérdida' },
  { value: 'inventario', label: 'Ajuste por inventario físico' },
];

export function StockModal({ productId, productName, currentStock, onClose, onStockUpdated }: StockModalProps) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('reposicion');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/products/${productId}/stock`)
      .then((r) => r.json())
      .then((data) => setMovements(data))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(amount);
    if (!qty || qty <= 0) { setError('Ingresa una cantidad válida'); return; }
    const delta = adjustType === 'add' ? qty : -qty;
    if (currentStock + delta < 0) { setError('El stock no puede quedar negativo'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/products/${productId}/stock`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta, reason }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Error al guardar'); return; }
      onStockUpdated(productId, data.stock);
      onClose();
    } catch {
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="font-bold text-slate-900">Ajustar Stock</h2>
            <p className="text-sm text-slate-500 truncate max-w-[300px]">{productName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current stock */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <p className="text-sm text-slate-500">Stock actual</p>
          <p className={`text-3xl font-bold ${currentStock === 0 ? 'text-red-600' : currentStock <= 10 ? 'text-orange-600' : 'text-slate-900'}`}>
            {currentStock} <span className="text-base font-normal text-slate-400">unidades</span>
          </p>
        </div>

        {/* Adjust form */}
        <form onSubmit={handleSubmit} className="p-6 border-b border-slate-200 shrink-0 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAdjustType('add')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors ${adjustType === 'add' ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-400' : 'bg-slate-100 text-slate-600'}`}
            >
              <TrendingUp className="w-4 h-4" /> Agregar
            </button>
            <button
              type="button"
              onClick={() => setAdjustType('subtract')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium text-sm transition-colors ${adjustType === 'subtract' ? 'bg-red-100 text-red-700 ring-2 ring-red-400' : 'bg-slate-100 text-slate-600'}`}
            >
              <TrendingDown className="w-4 h-4" /> Restar
            </button>
          </div>

          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Cantidad"
            className="input w-full text-center text-2xl font-bold"
            autoFocus
          />

          <select value={reason} onChange={(e) => setReason(e.target.value)} className="input w-full">
            {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn btn-primary w-full disabled:opacity-50">
            {saving ? 'Guardando...' : `${adjustType === 'add' ? 'Agregar' : 'Restar'} ${amount || '?'} unidades`}
          </button>
        </form>

        {/* History */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-3 sticky top-0 bg-white border-b border-slate-100">
            <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Historial de movimientos
            </p>
          </div>
          {loadingHistory ? (
            <div className="p-6 text-center text-slate-400 text-sm">Cargando...</div>
          ) : movements.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-sm">Sin movimientos registrados</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {movements.map((m) => (
                <div key={m.id} className="px-6 py-3 flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${m.delta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                    {m.delta > 0 ? '+' : ''}{m.delta}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{REASONS.find(r => r.value === m.reason)?.label || m.reason}</p>
                    <p className="text-xs text-slate-400">
                      {m.profiles?.name || m.profiles?.email || 'Admin'} · {new Date(m.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Build check**
```bash
./node_modules/.bin/next build 2>&1 | grep -E "error TS|Type error|Failed"
```

**Step 3: Commit**
```bash
git add src/components/admin/StockModal.tsx
git commit -m "feat: StockModal component - adjust stock + movement history"
```

---

## Task 5: Wire Inline Editing + Modal into Products Page

**Files:**
- Modify: `src/app/admin/productos/page.tsx`

**Step 1: Add imports** at top of file (after existing imports):

```typescript
import { History } from 'lucide-react';
import { StockModal } from '@/components/admin/StockModal';
```

**Step 2: Add state variables** inside the component (after existing state declarations):

```typescript
const [editingStockId, setEditingStockId] = useState<string | null>(null);
const [editingStockValue, setEditingStockValue] = useState<string>('');
const [stockModalProduct, setStockModalProduct] = useState<{ id: string; name: string; stock: number } | null>(null);
```

**Step 3: Add handlers** (after existing handlers, before the return statement):

```typescript
const handleStockClick = (productId: string, currentStock: number) => {
  setEditingStockId(productId);
  setEditingStockValue(String(currentStock));
};

const handleStockSave = async (productId: string) => {
  const newQty = parseInt(editingStockValue);
  const product = products.find(p => p.id === productId);
  if (!product || isNaN(newQty) || newQty < 0) {
    setEditingStockId(null);
    return;
  }
  const delta = newQty - product.stock;
  if (delta === 0) { setEditingStockId(null); return; }

  try {
    await fetch(`/api/admin/products/${productId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta, reason: 'correccion' }),
    });
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newQty } : p));
  } catch {
    // Silently fail, revert on reload
  }
  setEditingStockId(null);
};

const handleStockModalUpdate = (productId: string, newStock: number) => {
  setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
};
```

**Step 4: Replace the stock cell** in the desktop table. Find the existing stock display in the table (search for `p.stock` in the table row) and replace just the stock `<td>` cell:

```typescript
<td className="px-4 lg:px-6 py-4">
  <div className="flex items-center gap-1">
    {editingStockId === product.id ? (
      <input
        type="number"
        min="0"
        autoFocus
        value={editingStockValue}
        onChange={(e) => setEditingStockValue(e.target.value)}
        onBlur={() => handleStockSave(product.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleStockSave(product.id);
          if (e.key === 'Escape') setEditingStockId(null);
        }}
        className="w-20 px-2 py-1 text-sm border-2 border-emerald-400 rounded-lg font-mono text-center focus:outline-none"
      />
    ) : (
      <button
        onClick={() => handleStockClick(product.id, product.stock)}
        title="Click para editar"
        className={`px-2.5 py-1 rounded-lg text-sm font-mono font-medium cursor-text hover:ring-2 hover:ring-emerald-400 transition-all ${
          product.stock === 0
            ? 'bg-red-100 text-red-700'
            : product.stock <= 10
            ? 'bg-orange-100 text-orange-700'
            : 'bg-slate-100 text-slate-700'
        }`}
      >
        {product.stock}
      </button>
    )}
    <button
      onClick={() => setStockModalProduct({ id: product.id, name: product.name, stock: product.stock })}
      className="p-1 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 transition-colors"
      title="Ver historial"
    >
      <History className="w-3.5 h-3.5" />
    </button>
  </div>
</td>
```

**Step 5: Add StockModal** at the bottom of the return JSX (before the closing `</div>`):

```typescript
{stockModalProduct && (
  <StockModal
    productId={stockModalProduct.id}
    productName={stockModalProduct.name}
    currentStock={stockModalProduct.stock}
    onClose={() => setStockModalProduct(null)}
    onStockUpdated={handleStockModalUpdate}
  />
)}
```

**Step 6: Build check**
```bash
./node_modules/.bin/next build 2>&1 | grep -E "error TS|Type error|Failed"
```
Expected: no output.

**Step 7: Commit**
```bash
git add src/app/admin/productos/page.tsx
git commit -m "feat: inline stock editing + history modal in productos admin"
```

---

## Task 6: Settings API Endpoint

**Files:**
- Create: `src/app/api/admin/settings/route.ts`

**Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

export async function GET() {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const supabase = getServiceClient();
    const { data, error } = await supabase.from('admin_settings').select('*');
    if (error) return errorResponse(error.message, 500);

    // Convert to key-value object
    const settings = Object.fromEntries((data || []).map(r => [r.key, r.value]));
    return NextResponse.json(settings);
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const body = await request.json() as Record<string, string>;
    const supabase = getServiceClient();

    const updates = Object.entries(body).map(([key, value]) => ({
      key,
      value: String(value),
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('admin_settings')
      .upsert(updates, { onConflict: 'key' });

    if (error) return errorResponse(error.message, 500);
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}
```

**Step 2: Commit**
```bash
git add src/app/api/admin/settings/route.ts
git commit -m "feat: admin settings API - GET/PATCH key-value store"
```

---

## Task 7: Settings Page

**Files:**
- Create: `src/app/admin/configuracion/page.tsx`

**Step 1: Create the file**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Save, Mail, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AdminConfigPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [alertEmail, setAlertEmail] = useState('');
  const [threshold, setThreshold] = useState('10');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        setAlertEmail(data.alert_email || '');
        setThreshold(data.low_stock_threshold || '10');
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_email: alertEmail, low_stock_threshold: threshold }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500 mt-1">Ajustes del panel de administración</p>
      </div>

      {loading ? (
        <div className="card p-8 animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-10 bg-slate-200 rounded" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="card p-6 space-y-6">
          <h2 className="font-semibold text-slate-900 border-b border-slate-100 pb-3">Alertas de Stock</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email para alertas de stock crítico
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={alertEmail}
                onChange={e => setAlertEmail(e.target.value)}
                className="input pl-10 w-full"
                placeholder="admin@farmacia.com"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Recibirás un email cuando el stock de un producto baje del umbral.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Umbral de stock crítico (unidades)
            </label>
            <div className="relative">
              <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                min="1"
                max="100"
                value={threshold}
                onChange={e => setThreshold(e.target.value)}
                className="input pl-10 w-32"
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Productos con stock ≤ este número aparecen en el badge de alerta.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn btn-primary flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Guardado
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
```

**Step 2: Add Configuración to Sidebar nav** in `src/components/admin/Sidebar.tsx`:

Find `const navItems = [` and add two items:
```typescript
{ href: '/admin/reportes', icon: BarChart2, label: 'Reportes' },
{ href: '/admin/configuracion', icon: Settings, label: 'Configuracion' },
```
And add to imports: `BarChart2, Settings` from lucide-react.

**Step 3: Build check + commit**
```bash
./node_modules/.bin/next build 2>&1 | grep -E "error TS|Type error|Failed"
git add src/app/admin/configuracion/page.tsx src/components/admin/Sidebar.tsx
git commit -m "feat: admin settings page + add Reportes/Configuracion to sidebar nav"
```

---

## Task 8: Reports API Endpoint

**Files:**
- Create: `src/app/api/admin/reportes/route.ts`

**Step 1: Create the file**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser, errorResponse, getServiceClient } from '@/lib/supabase/api-helpers';

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) return errorResponse('Unauthorized', 403);

    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from') || getDefaultFrom(30);
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

    const supabase = getServiceClient();

    // Fetch orders in date range (paid/processing/shipped/delivered only)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total, created_at, status')
      .gte('created_at', from + 'T00:00:00Z')
      .lte('created_at', to + 'T23:59:59Z')
      .in('status', ['paid', 'processing', 'shipped', 'delivered']);

    if (ordersError) return errorResponse(ordersError.message, 500);

    const orderIds = (orders || []).map(o => o.id);

    // Fetch order items for those orders
    const { data: items, error: itemsError } = orderIds.length > 0
      ? await supabase
          .from('order_items')
          .select(`
            product_id, product_name, quantity, price_at_purchase,
            products:product_id ( category_id, categories:category_id ( name ) )
          `)
          .in('order_id', orderIds)
      : { data: [], error: null };

    if (itemsError) return errorResponse(itemsError.message, 500);

    // KPIs
    const totalRevenue = (orders || []).reduce((sum, o) => sum + parseFloat(o.total), 0);
    const totalOrders = (orders || []).length;
    const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Sales by day
    const salesByDay: Record<string, { ventas: number; ordenes: number }> = {};
    (orders || []).forEach(o => {
      const day = o.created_at.split('T')[0];
      if (!salesByDay[day]) salesByDay[day] = { ventas: 0, ordenes: 0 };
      salesByDay[day].ventas += parseFloat(o.total);
      salesByDay[day].ordenes += 1;
    });
    const salesByDayArr = Object.entries(salesByDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top products from order_items
    const productMap: Record<string, { name: string; units: number; revenue: number; category: string }> = {};
    (items || []).forEach((item: any) => {
      const key = item.product_id || item.product_name;
      if (!productMap[key]) {
        productMap[key] = {
          name: item.product_name,
          units: 0,
          revenue: 0,
          category: item.products?.categories?.name || 'Sin categoría',
        };
      }
      productMap[key].units += item.quantity;
      productMap[key].revenue += item.quantity * parseFloat(item.price_at_purchase);
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.units - a.units)
      .slice(0, 10);

    // By category
    const categoryMap: Record<string, { name: string; revenue: number; units: number }> = {};
    (items || []).forEach((item: any) => {
      const cat = item.products?.categories?.name || 'Sin categoría';
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, revenue: 0, units: 0 };
      categoryMap[cat].revenue += item.quantity * parseFloat(item.price_at_purchase);
      categoryMap[cat].units += item.quantity;
    });
    const byCategory = Object.values(categoryMap).sort((a, b) => b.revenue - a.revenue);

    return NextResponse.json({
      kpis: { totalRevenue, totalOrders, avgTicket },
      salesByDay: salesByDayArr,
      topProducts,
      byCategory,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Internal error', 500);
  }
}

function getDefaultFrom(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}
```

**Step 2: Commit**
```bash
git add src/app/api/admin/reportes/route.ts
git commit -m "feat: reports API - real sales data from order_items"
```

---

## Task 9: Reports Page UI

**Files:**
- Create: `src/app/admin/reportes/page.tsx`

**Step 1: Create the file**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/format';
import { Download, TrendingUp, ShoppingBag, Calculator, Package } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface ReportData {
  kpis: { totalRevenue: number; totalOrders: number; avgTicket: number };
  salesByDay: { date: string; ventas: number; ordenes: number }[];
  topProducts: { name: string; units: number; revenue: number; category: string }[];
  byCategory: { name: string; revenue: number; units: number }[];
}

const PERIODS = [
  { label: '7 días', days: 7 },
  { label: '30 días', days: 30 },
  { label: '90 días', days: 90 },
];

const COLORS = ['#10B981','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#06B6D4','#84CC16','#F97316'];

function getFromDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

export default function AdminReportesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const from = getFromDate(period);
      const to = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/admin/reportes?from=${from}&to=${to}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return; }
    loadData();
  }, [user, router, loadData]);

  const exportCSV = () => {
    if (!data) return;
    const headers = ['Producto', 'Categoría', 'Unidades vendidas', 'Revenue (CLP)'];
    const rows = data.topProducts.map(p => [p.name, p.category, p.units, Math.round(p.revenue)]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `reportes_${getFromDate(period)}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reportes</h1>
          <p className="text-slate-500 mt-1">Ventas reales desde órdenes pagadas</p>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${period === p.days ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
            >
              {p.label}
            </button>
          ))}
          <button onClick={exportCSV} disabled={loading || !data} className="btn btn-secondary flex items-center gap-2 disabled:opacity-50">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card p-6 animate-pulse h-24 bg-slate-200 rounded-2xl" />)}
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Revenue total', value: formatPrice(data.kpis.totalRevenue), icon: TrendingUp, color: 'emerald' },
              { label: 'Órdenes', value: data.kpis.totalOrders, icon: ShoppingBag, color: 'blue' },
              { label: 'Ticket promedio', value: formatPrice(data.kpis.avgTicket), icon: Calculator, color: 'purple' },
              { label: 'Productos distintos', value: data.topProducts.length, icon: Package, color: 'orange' },
            ].map(kpi => (
              <div key={kpi.label} className="card p-5">
                <div className={`w-10 h-10 bg-${kpi.color}-100 rounded-xl flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-5 h-5 text-${kpi.color}-600`} />
                </div>
                <p className="text-sm text-slate-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Sales by day */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Ventas por día</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.salesByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickFormatter={d => d.slice(5)} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [formatPrice(Number(v)), 'Ventas']} />
                    <Line type="monotone" dataKey="ventas" stroke="#10B981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* By category pie */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">Revenue por categoría</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.byCategory} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''} labelLine={false}>
                      {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatPrice(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top products horizontal bar */}
            <div className="card p-6 lg:col-span-2">
              <h3 className="font-semibold text-slate-900 mb-4">Top 10 productos más vendidos</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.topProducts.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                    <YAxis dataKey="name" type="category" width={180} stroke="#94A3B8" fontSize={10} tickFormatter={n => n.length > 22 ? n.slice(0, 22) + '…' : n} />
                    <Tooltip formatter={(v, name) => [v, name === 'units' ? 'Unidades' : 'Revenue']} />
                    <Bar dataKey="units" fill="#10B981" radius={[0, 4, 4, 0]} name="units" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detail Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Detalle por producto</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {['Producto', 'Categoría', 'Unidades', 'Revenue'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topProducts.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{p.category}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-700">{p.units}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-700">{formatPrice(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="card p-12 text-center text-slate-400">No hay datos para el período seleccionado</div>
      )}
    </div>
  );
}
```

**Step 2: Build check**
```bash
./node_modules/.bin/next build 2>&1 | grep -E "error TS|Type error|Failed"
```

**Step 3: Commit**
```bash
git add src/app/admin/reportes/page.tsx
git commit -m "feat: /admin/reportes page - real sales data, charts, CSV export"
```

---

## Task 10: Email Alerts (Resend)

**Files:**
- Modify: `pharmacy-ecommerce/apps/web/package.json` (add resend)
- Create: `src/lib/email.ts`
- Modify: `src/app/api/admin/orders/[id]/route.ts` (trigger on paid)

**Step 1: Install resend**
```bash
cd pharmacy-ecommerce/apps/web
npm install resend
```

**Step 2: Add env variable**
Create/update `.env.local` (never commit this file):
```
RESEND_API_KEY=re_your_key_here
```
Also add to Vercel environment variables via dashboard.

**Step 3: Create `src/lib/email.ts`**

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface LowStockProduct {
  name: string;
  stock: number;
}

export async function sendLowStockAlert(
  toEmail: string,
  products: LowStockProduct[],
  threshold: number
) {
  if (!process.env.RESEND_API_KEY || !toEmail || products.length === 0) return;

  const productList = products
    .map(p => `- ${p.name}: ${p.stock} unidades (umbral: ${threshold})`)
    .join('\n');

  await resend.emails.send({
    from: 'Tu Farmacia Admin <onboarding@resend.dev>',
    to: toEmail,
    subject: `⚠️ Alerta: ${products.length} producto(s) con stock crítico`,
    text: `Los siguientes productos tienen stock bajo el umbral configurado (${threshold} unidades):\n\n${productList}\n\nIngresa al panel admin para gestionar el stock:\nhttps://tu-farmacia.vercel.app/admin/productos`,
  });
}
```

**Step 4: Wire email trigger in `src/app/api/admin/orders/[id]/route.ts`**

After `approveReservation` completes successfully (after updating status to 'processing'), add a low-stock check and email trigger. Add this helper function at the bottom of the file:

```typescript
async function checkAndAlertLowStock(supabase: ReturnType<typeof getServiceClient>, itemProductIds: string[]) {
  try {
    // Get alert settings
    const { data: settings } = await supabase.from('admin_settings').select('key, value');
    const settingsMap = Object.fromEntries((settings || []).map(s => [s.key, s.value]));
    const threshold = parseInt(settingsMap.low_stock_threshold || '10');
    const alertEmail = settingsMap.alert_email;
    if (!alertEmail) return;

    // Check stock of affected products
    const { data: products } = await supabase
      .from('products')
      .select('name, stock')
      .in('id', itemProductIds)
      .lte('stock', threshold);

    if (products && products.length > 0) {
      const { sendLowStockAlert } = await import('@/lib/email');
      await sendLowStockAlert(alertEmail, products, threshold);
    }
  } catch (err) {
    // Don't fail the main request if email fails
    console.error('Low stock alert error:', err);
  }
}
```

Then in `approveReservation`, after the final `return NextResponse.json(data)`, add before the return:
```typescript
  // Trigger low-stock email alert (non-blocking)
  const productIds = (items || []).map(i => i.product_id).filter(Boolean) as string[];
  checkAndAlertLowStock(supabase, productIds);
```

**Step 5: Build check**
```bash
./node_modules/.bin/next build 2>&1 | grep -E "error TS|Type error|Failed"
```

**Step 6: Commit**
```bash
git add src/lib/email.ts src/app/api/admin/orders/[id]/route.ts package.json package-lock.json
git commit -m "feat: low stock email alerts via Resend + trigger on reservation approval"
```

---

## Task 11: Update Dashboard Top Products Chart

**Files:**
- Modify: `src/app/admin/page.tsx`

**Step 1:** In `loadStats()`, replace the `calculateTopProducts` call with a real API call:

Find `const topProductsList = calculateTopProducts(...)` and replace:
```typescript
// Real top products from order_items via reports API
const from30d = new Date();
from30d.setDate(from30d.getDate() - 30);
const fromStr = from30d.toISOString().split('T')[0];
const toStr = new Date().toISOString().split('T')[0];
const reportRes = await fetch(`/api/admin/reportes?from=${fromStr}&to=${toStr}`);
const reportData = await reportRes.json();
const topProductsList: TopProduct[] = (reportData.topProducts || []).slice(0, 5).map((p: { name: string; units: number }) => ({
  name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
  cantidad: p.units,
}));
```

Delete the unused `calculateTopProducts` function.

**Step 2: Build check + final commit**
```bash
./node_modules/.bin/next build 2>&1 | grep -E "error TS|Type error|Failed"
git add src/app/admin/page.tsx
git commit -m "feat: dashboard top products now uses real order_items data"
```

---

## Task 12: Push & Verify Deploy

**Step 1: Push to trigger Vercel deploy**
```bash
cd /c/Users/Pablo/Documents/GitHub/build-and-deploy-webdev-asap
git push origin main
```

**Step 2: Check Vercel build**
```bash
# Wait ~2 min then check
vercel logs --last 20
```

**Step 3: Smoke test checklist**
- [ ] `/admin/productos` — click stock number → editable inline → Enter saves
- [ ] `/admin/productos` — click 🕐 icon → StockModal opens, shows history, can adjust
- [ ] `/admin/reportes` — shows real KPIs, charts, table; period buttons work; CSV exports
- [ ] `/admin/configuracion` — form loads settings, save works
- [ ] Approve a reservation → low-stock email fires if applicable

**Step 4: Update bitacora**
Add section to `pharmacy-ecommerce/bitacora.md` documenting all new features.
```bash
git add pharmacy-ecommerce/bitacora.md
git commit -m "docs: update bitacora with stock management, reports, and alerts"
git push origin main
```
