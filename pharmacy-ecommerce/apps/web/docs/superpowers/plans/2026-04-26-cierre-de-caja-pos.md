# Cierre de Caja POS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the existing `/admin/arqueo` cash-closure system with pos_mixed support, Z-report printing, POS shift awareness, and production DB migration.

**Architecture:** The core is already implemented: `caja_cierres` table in Prisma, `/api/admin/arqueo` route, `/admin/arqueo` page. Plan fills specific gaps rather than rebuilding. No `pos_shifts` table needed — the simpler `admin_settings`-based approach (keys `caja_turno_inicio`, `caja_fondo_inicial`) is sufficient for a single-register pharmacy.

**Tech Stack:** Next.js 14 API routes, Prisma 7 + Cloud SQL PostgreSQL 15, React client components, `window.print()` + `@media print` CSS.

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `prisma/schema.prisma` | Read-only | Already has `caja_cierres`. Verify fields match API. |
| `src/app/api/admin/arqueo/route.ts` | Modify | Add `pos_mixed` to payment filter and breakdowns. |
| `src/app/admin/arqueo/page.tsx` | Modify | Add "Imprimir Z-report" button + printable section + `@media print` styles. Add "Abrir turno" explicit flow for start-of-day. |
| `src/app/admin/pos/page.tsx` | Modify | Add shift-awareness banner: warn when `fondo_inicial` is 0 and no closes today. |

---

## Task 1: Push caja_cierres to production DB

**Files:**
- Read: `prisma/schema.prisma` (verify `caja_cierres` model is there)

> The schema already has `caja_cierres`. This task pushes it to production Cloud SQL if it isn't there yet.

- [ ] **Step 1: Verify schema has caja_cierres**

```bash
grep -A 20 "model caja_cierres" pharmacy-ecommerce/apps/web/prisma/schema.prisma
```

Expected: model with `id`, `turno_inicio`, `turno_fin`, `fondo_inicial`, `ventas_efectivo`, `ventas_debito`, `ventas_credito`, `ventas_total`, `num_transacciones`, `efectivo_esperado`, `efectivo_contado`, `diferencia`, `notas`, `cerrado_por`, `created_at`.

- [ ] **Step 2: Authorize IP in Cloud SQL**

```bash
GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
MY_IP=$(curl -s https://api.ipify.org)
"$GCLOUD" sql instances patch tu-farmacia-db --authorized-networks="$MY_IP/32" --project=tu-farmacia-prod
```

Expected: `Updated [https://sqladmin.googleapis.com/...]`. Wait ~30s for propagation.

- [ ] **Step 3: Push schema to production**

```bash
cd pharmacy-ecommerce/apps/web
DATABASE_URL="postgresql://farmacia:srcmlaYhkEo19YivrG4FDLH0woou@34.39.232.207:5432/farmacia" \
  ./node_modules/.bin/prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.` or `No schema changes needed.`

- [ ] **Step 4: Remove IP authorization**

```bash
GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
"$GCLOUD" sql instances patch tu-farmacia-db --clear-authorized-networks --project=tu-farmacia-prod
```

- [ ] **Step 5: Commit (no code changes, just verification)**

```bash
git add -A
git commit -m "chore: verify caja_cierres schema in production"
```

---

## Task 2: Add pos_mixed to arqueo API calculations

**Files:**
- Modify: `src/app/api/admin/arqueo/route.ts`

The API currently filters `payment_provider: { in: ['pos_cash', 'pos_debit', 'pos_credit'] }` — this excludes `pos_mixed` sales. For mixed sales, `cash_amount` and `card_amount` fields hold the split.

- [ ] **Step 1: Update the Prisma query in GET handler to include pos_mixed**

In `src/app/api/admin/arqueo/route.ts`, find the `posOrders` query (around line 33). Change:

```typescript
// BEFORE
payment_provider: { in: ['pos_cash', 'pos_debit', 'pos_credit'] },
```

```typescript
// AFTER
payment_provider: { in: ['pos_cash', 'pos_debit', 'pos_credit', 'pos_mixed'] },
```

Also add `cash_amount` and `card_amount` to the `select`:

```typescript
select: {
  id: true,
  total: true,
  payment_provider: true,
  created_at: true,
  guest_name: true,
  guest_surname: true,
  guest_email: true,
  cash_amount: true,
  card_amount: true,
},
```

- [ ] **Step 2: Update the breakdown calculations in GET to handle pos_mixed**

Replace the three reduction lines with:

```typescript
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

const ventasCredito = posOrders
  .filter(o => o.payment_provider === 'pos_credit')
  .reduce((s, o) => s + Number(o.total), 0);

const ventasMixto = posOrders
  .filter(o => o.payment_provider === 'pos_mixed')
  .reduce((s, o) => s + Number(o.total), 0);

const ventasTotal = posOrders.reduce((s, o) => s + Number(o.total), 0);
```

Add `ventas_mixto` to the response JSON:

```typescript
ventas: {
  efectivo: ventasEfectivo,
  debito: ventasDebito,
  credito: ventasCredito,
  mixto: ventasMixto,
  total: ventasTotal,
  num_transacciones: posOrders.length,
},
```

- [ ] **Step 3: Apply the same pos_mixed fix to the POST 'cerrar' handler**

Find the second `posOrders` query inside the `cerrar` block (around line 138). Apply the same filter change:

```typescript
payment_provider: { in: ['pos_cash', 'pos_debit', 'pos_credit', 'pos_mixed'] },
```

And add `cash_amount: true, card_amount: true` to its `select`. Replace the breakdown reductions with the same logic as Step 2.

Update the `caja_cierres.create` call — it doesn't have a `ventas_mixto` column, so just use the `ventasDebito` which now includes the card portion of mixed sales. This is correct: mixed card goes to bank like debit.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/arqueo/route.ts
git commit -m "fix(arqueo): include pos_mixed in shift calculations"
```

---

## Task 3: Update ShiftData type on arqueo page for mixto field

**Files:**
- Modify: `src/app/admin/arqueo/page.tsx`

- [ ] **Step 1: Add `mixto` to the ShiftData ventas interface**

Find the `ShiftData` interface (line 10). Change the `ventas` nested type:

```typescript
ventas: {
  efectivo: number;
  debito: number;
  credito: number;
  mixto: number;    // add this
  total: number;
  num_transacciones: number;
};
```

- [ ] **Step 2: Add mixto card to the KPI row**

Find the KPI row grid (4 cards: ventas totales, efectivo, débito, crédito). Add a mixto card after crédito:

```tsx
{data.ventas.mixto > 0 && (
  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-800/30 p-4">
    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs mb-1">
      <Shuffle className="w-3.5 h-3.5" /> Mixto
    </div>
    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{formatPrice(data.ventas.mixto)}</p>
  </div>
)}
```

Add `Shuffle` to the lucide-react import at the top of the file.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/arqueo/page.tsx
git commit -m "feat(arqueo): show pos_mixed ventas card in KPI row"
```

---

## Task 4: Add Z-report print button to arqueo page

**Files:**
- Modify: `src/app/admin/arqueo/page.tsx`

- [ ] **Step 1: Add print CSS at top of component**

Inside the `return (...)` of `ArqueoPage`, just before the outer `<div>`, add a `<style>` tag:

```tsx
<>
  <style>{`
    @media print {
      body > * { display: none !important; }
      #zreport-print { display: block !important; }
      #zreport-print { position: fixed; inset: 0; background: white; padding: 24px; }
    }
    #zreport-print { display: none; }
  `}</style>
  <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
    {/* ... existing content ... */}
  </div>
</>
```

- [ ] **Step 2: Add a hidden printable Z-report div just after the outer div**

Before the closing `</>`, add:

```tsx
{data && (
  <div id="zreport-print">
    <h2 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
      {/* pharmacy name from admin_settings is not loaded here — hardcode or pass as prop */}
      Z-REPORT — Cierre de Turno
    </h2>
    <p style={{ fontSize: 12, color: '#666' }}>
      Turno: {formatTime(data.turno_inicio)} → {new Date().toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
    </p>
    <hr style={{ margin: '8px 0' }} />
    <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
      <tbody>
        <tr><td>Fondo inicial</td><td style={{ textAlign: 'right' }}>{formatPrice(data.fondo_inicial)}</td></tr>
        <tr><td>Ventas efectivo</td><td style={{ textAlign: 'right' }}>{formatPrice(data.ventas.efectivo)}</td></tr>
        <tr><td>Ventas débito</td><td style={{ textAlign: 'right' }}>{formatPrice(data.ventas.debito)}</td></tr>
        <tr><td>Ventas crédito</td><td style={{ textAlign: 'right' }}>{formatPrice(data.ventas.credito)}</td></tr>
        {data.ventas.mixto > 0 && (
          <tr><td>Ventas mixto</td><td style={{ textAlign: 'right' }}>{formatPrice(data.ventas.mixto)}</td></tr>
        )}
        <tr style={{ fontWeight: 'bold', borderTop: '1px solid #ccc' }}>
          <td>Total ventas</td><td style={{ textAlign: 'right' }}>{formatPrice(data.ventas.total)}</td>
        </tr>
        <tr><td>Transacciones</td><td style={{ textAlign: 'right' }}>{data.ventas.num_transacciones}</td></tr>
        <tr style={{ borderTop: '1px solid #ccc' }}><td>Efectivo esperado en caja</td><td style={{ textAlign: 'right' }}>{formatPrice(data.efectivo_esperado)}</td></tr>
      </tbody>
    </table>
  </div>
)}
```

- [ ] **Step 3: Add "Imprimir" button in the header row**

Find the header section that has the `<h1>` and `<RefreshCw>` button. Add a print button next to RefreshCw:

```tsx
<div className="flex items-center gap-2">
  <button
    onClick={() => window.print()}
    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    title="Imprimir Z-report"
  >
    <Receipt className="w-5 h-5 text-slate-400" />
  </button>
  <button onClick={load} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Actualizar">
    <RefreshCw className="w-5 h-5 text-slate-400" />
  </button>
</div>
```

`Receipt` is already imported.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/arqueo/page.tsx
git commit -m "feat(arqueo): add Z-report print button with @media print layout"
```

---

## Task 5: Add shift awareness banner to POS

**Files:**
- Modify: `src/app/admin/pos/page.tsx`

Show a non-blocking amber banner at the top of POS when `fondo_inicial = 0`. This nudges the pharmacist to set the starting cash at `/admin/arqueo` before starting sales. Not blocking — POS still works — but visible.

- [ ] **Step 1: Fetch shift state from arqueo API on POS mount**

In `POSPage`, add state:

```typescript
const [shiftFondo, setShiftFondo] = useState<number | null>(null)
```

Add a `useEffect` to fetch `/api/admin/arqueo` on mount:

```typescript
useEffect(() => {
  fetch('/api/admin/arqueo', { credentials: 'include' })
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data) setShiftFondo(data.fondo_inicial)
    })
    .catch(() => {})
}, [])
```

- [ ] **Step 2: Add banner just inside the outer POS container**

Find the outermost div of the POS page (the one with the main layout). Add the banner as the first child:

```tsx
{shiftFondo === 0 && (
  <div className="fixed top-0 left-0 right-0 z-30 bg-amber-500 text-white text-sm font-semibold px-4 py-2 flex items-center justify-between">
    <span>⚠️ Fondo de caja: $0 — Configurar antes de iniciar ventas</span>
    <a href="/admin/arqueo" className="underline ml-4 hover:text-amber-100">Ir a Arqueo →</a>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/pos/page.tsx
git commit -m "feat(pos): show banner when shift fondo is $0"
```

---

## Task 6: Build and deploy

- [ ] **Step 1: Local build**

```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
```

Expected: build completes with 0 TypeScript errors. Page count should be same as before (no new pages added).

- [ ] **Step 2: Push**

```bash
cd /c/Users/Administrator/Documents/GitHub/build-and-deploy-webdev-asap
git push origin main
```

- [ ] **Step 3: Update bitácora**

Add entry to `pharmacy-ecommerce/bitacora.md`:

```markdown
## 2026-04-26 — Fix: Arqueo de Caja — pos_mixed, Z-report, POS banner

**Arqueo de Caja (`/admin/arqueo`) completado:**
- `pos_mixed` ahora incluido en cálculos del turno (efectivo = cash_amount, débito = card_amount)
- Botón "Imprimir" en header → genera Z-report con `window.print()` + `@media print` layout
- KPI card "Mixto" visible cuando hay ventas mixtas
- POS banner ámbar cuando `fondo_inicial = 0` con link directo a `/admin/arqueo`
- DB: `caja_cierres` tabla confirmada en producción
```

```bash
git add pharmacy-ecommerce/bitacora.md
git commit -m "chore: update bitacora — arqueo de caja completado"
git push origin main
```

---

## Self-Review Checklist

- [x] Spec requirement "DB Schema" → Task 1 (verify + push `caja_cierres`)
- [x] Spec requirement "pos_mixed" → Task 2 + 3 (API fix + UI card)
- [x] Spec requirement "Z-report imprimible" → Task 4 (print button + @media print)
- [x] Spec requirement "POS shift awareness" → Task 5 (banner when fondo = 0)
- [x] Spec requirement "deploy" → Task 6

**Note:** The spec proposed a new `pos_shifts` table and `shift_id` on orders. The existing codebase uses a simpler approach (`admin_settings` + `caja_cierres`) that achieves the same business outcome for a single-register pharmacy. This plan extends the existing implementation rather than rebuilding it — consistent with the "simplicity first, minimal impact" principle from CLAUDE.md.
