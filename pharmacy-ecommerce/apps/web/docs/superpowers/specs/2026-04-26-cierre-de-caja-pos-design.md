# Cierre de Caja POS — Design Spec

**Date:** 2026-04-26  
**Status:** Approved  
**Scope:** POS shift management (apertura + cierre de turno + Z-report + historial)

---

## Problem

The POS has no formal shift management. There is no way to:
- Record the starting cash float (fondo inicial)
- Reconcile expected vs actual cash at end of shift
- Generate a Z-report for accounting
- Track who worked each shift

A pharmacist cannot close the register properly without this.

---

## Architecture

### DB Schema

New table `pos_shifts`:

```prisma
model pos_shifts {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  opened_by           String    @db.VarChar(255)   // Firebase UID or admin email
  opened_at           DateTime  @default(now()) @db.Timestamptz(6)
  closed_at           DateTime? @db.Timestamptz(6)
  initial_cash        Decimal   @db.Decimal(10, 2) // starting cash float
  final_cash_counted  Decimal?  @db.Decimal(10, 2) // manually counted at close
  expected_cash       Decimal?  @db.Decimal(10, 2) // initial_cash + cash sales during shift
  difference          Decimal?  @db.Decimal(10, 2) // final_counted - expected (+ surplus, - shortage)
  notes               String?
  status              String    @default("open") @db.VarChar(20) // open | closed
  orders              orders[]
}
```

Modified `orders` table — add field:

```prisma
shift_id  String?  @db.Uuid
pos_shifts pos_shifts? @relation(fields: [shift_id], references: [id], onDelete: SetNull)
```

**Constraint:** Maximum 1 open shift at a time. Enforced in the open-shift API (query for existing open shift before creating).

---

## API Routes

| Method | Path | Action |
|--------|------|--------|
| `POST` | `/api/admin/pos/shifts` | Open new shift. Body: `{ initial_cash }`. Fails if shift already open. Sets `opened_by` from session. |
| `GET` | `/api/admin/pos/shifts/current` | Returns active shift or `null`. Includes running totals by payment method. |
| `POST` | `/api/admin/pos/shifts/[id]/close` | Close shift. Body: `{ final_cash_counted, notes? }`. Calculates `expected_cash` and `difference`. Sets `closed_at`. |
| `GET` | `/api/admin/pos/shifts` | Paginated history of closed shifts. |
| `GET` | `/api/admin/pos/shifts/[id]` | Full shift detail: metadata + sales breakdown by payment method. |

**Existing route change:**  
`POST /api/admin/pos/sale` — automatically attaches `shift_id` of the current open shift to the created order. If no open shift, returns `400 "No hay turno abierto"`.

---

## UI / UX

### POS Page (`/admin/pos`) — Changes

**No active shift:**
- Blocking modal on page load: "Abrir Turno"
- Single input: fondo inicial (CLP)
- Confirm button → calls `POST /api/admin/pos/shifts`
- Cannot make sales until shift is open

**Active shift — header badge:**
- Shows: `Turno abierto desde HH:MM | Fondo: $X.000`
- Button: "Cerrar Turno" (top right)

**Close shift modal:**
- Summary table:
  - Ventas efectivo: N transacciones / $X
  - Ventas débito: N / $Y
  - Ventas crédito: N / $Z
  - Total ventas: $W
- Efectivo esperado en caja = fondo inicial + ventas efectivo (calculated, read-only)
- Input: "Efectivo contado" (manual entry)
- Difference shown in real time: green if ≥ 0, red if negative
- Notes field (optional)
- Button: "Cerrar y generar Z-report"

### Z-Report (modal + print)

Content:
- Farmacia name (from `admin_settings`)
- Date, turno abierto HH:MM → cerrado HH:MM
- Opened by (email)
- Fondo inicial
- Ventas por método de pago (efectivo / débito / crédito)
- Total transacciones / total ventas
- Efectivo esperado / contado / diferencia
- Notes

Print: `window.print()` with `@media print` CSS — hides nav/sidebar, prints only report content.

### History Page (`/admin/pos/cierres`)

- Table: fecha, quién abrió, hora apertura → cierre, total ventas, diferencia (green/red badge)
- Click row → full shift detail modal or page
- Sidebar link: "Cierres" under POS section

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Attempt sale with no open shift | `POST /api/admin/pos/sale` returns `400`. POS shows error toast. |
| Attempt to open shift when one is already open | `POST /api/admin/pos/shifts` returns `409`. |
| Close shift with no sales | Allowed. Expected cash = initial_cash. |
| Negative initial_cash | Frontend validation rejects. |

---

## Out of Scope (for now)

- Cash withdrawals / partial arqueos mid-shift
- Multiple simultaneous shifts (one register only)
- Automatic email of Z-report
- Integration with SII (boletas electrónicas)
