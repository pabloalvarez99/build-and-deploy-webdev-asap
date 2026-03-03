# Design: Admin Panel — Stock Management, Reports & Alerts

**Date:** 2026-03-02
**Project:** Tu Farmacia (pharmacy-ecommerce)
**Status:** Approved

---

## Overview

Three interconnected improvements to the admin panel:
1. **Stock Management** — inline editing + full movement history with DB audit trail
2. **Reports Page** — real sales data from order_items, charts, CSV export
3. **Stock Alerts** — sidebar badge + configurable email notifications via Resend

---

## Section 1: Stock Management

### Inline Editing (product list table)
- Clicking the stock number in `admin/productos` converts it to an `<input type="number">` with autoselect
- **Enter** or **blur** → saves via `PATCH /api/admin/products/[id]/stock`, registers a `stock_movements` row
- **Escape** → cancels without saving
- Visual feedback: number flashes green on save, red on error

### Stock History Modal
- Clock icon (🕐) next to each stock number opens a modal
- Modal shows: current stock + movement table (date, delta `+20 / -5`, reason, admin name)
- Inline adjustment form with reason dropdown: `reposición | corrección | merma | inventario`

### New DB Table
```sql
CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  delta integer NOT NULL,       -- positive = stock in, negative = stock out
  reason text,                  -- 'reposicion' | 'correccion' | 'merma' | 'venta' | 'reserva'
  admin_id uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: admin role only
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON stock_movements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

### API Endpoint
`PATCH /api/admin/products/[id]/stock`
- Body: `{ delta: number, reason: string }`
- Updates `products.stock += delta` and inserts into `stock_movements`
- Returns updated product

`GET /api/admin/products/[id]/stock/history`
- Returns last 50 `stock_movements` for the product

---

## Section 2: Reports Page (`/admin/reportes`)

### Period Selector
- Quick tabs: Últimos 7d / 30d / 90d + custom date range picker
- All charts and tables update reactively

### KPI Cards (top of page)
- Total ventas (revenue from paid/processing/shipped/delivered orders)
- Total órdenes
- Ticket promedio
- Comparación vs previous period (↑↓ %)

### Charts
1. **Line chart** — Ventas por día (real data from `orders` filtered by status + date)
2. **Horizontal bar chart** — Top 10 productos más vendidos (from `order_items` aggregated)
3. **Pie chart** — Ventas por categoría (from `order_items` joined to `products.category_id`)

### Detail Table
Columns: Producto | Categoría | Unidades vendidas | Revenue
Sortable by any column, exportable to CSV (UTF-8 BOM for Excel compatibility).

### Dashboard Update
- Replace simulated "Top Productos" bar chart with real data widget
- Add "Ver reportes completos →" link

### API Endpoint
`GET /api/admin/reportes?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Queries `orders` + `order_items` with service role client
- Returns: `{ kpis, salesByDay, topProducts, byCategory }`

---

## Section 3: Stock Alerts

### Sidebar Badge
- Admin layout loads a lightweight count query on mount: products where `stock <= threshold`
- Badge shown as red circle with count next to "Productos" nav item
- Threshold read from `admin_settings` table (default: 10)

### Email Alerts via Resend
- **Trigger**: when an order is approved/paid and post-deduction stock falls below threshold
- **Recipient**: email address from `admin_settings.alert_email`
- **Content**: list of products that crossed the threshold, with current stock
- **Service**: Resend (free tier: 3,000 emails/month, single npm package)

### New DB Table
```sql
CREATE TABLE admin_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Seed defaults
INSERT INTO admin_settings VALUES
  ('low_stock_threshold', '10', now()),
  ('alert_email', 'admin@pharmacy.com', now());
```

### Settings Page (`/admin/configuracion`)
- Form to update `alert_email` and `low_stock_threshold`
- Saves via `PATCH /api/admin/settings`
- Simple card layout, no overengineering

### New Files
- `src/lib/email.ts` — Resend wrapper with `sendLowStockAlert(products[])` function
- Alert triggered inside existing `PUT /api/admin/orders/[id]` when status → paid/approved

---

## New Dependencies
- `resend` — email service SDK (Anthropic-recommended for Next.js)

### Environment Variables to Add
```
RESEND_API_KEY=re_xxxxx
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| Supabase: `stock_movements` table | Create (SQL migration) |
| Supabase: `admin_settings` table | Create (SQL migration) |
| `src/app/admin/productos/page.tsx` | Modify (inline edit + modal button) |
| `src/components/admin/StockModal.tsx` | New |
| `src/app/api/admin/products/[id]/stock/route.ts` | New |
| `src/app/admin/reportes/page.tsx` | New |
| `src/app/api/admin/reportes/route.ts` | New |
| `src/app/admin/configuracion/page.tsx` | New |
| `src/app/api/admin/settings/route.ts` | New |
| `src/lib/email.ts` | New |
| `src/components/admin/Sidebar.tsx` | Modify (low stock badge) |
| `src/app/admin/page.tsx` | Modify (replace fake top products chart) |
| `src/app/api/admin/orders/[id]/route.ts` | Modify (trigger email on paid/approved) |
| `pharmacy-ecommerce/package.json` | Add `resend` dependency |

---

## Implementation Order

1. DB migrations (stock_movements + admin_settings) — unblocks everything
2. Stock API endpoint + inline edit UI — highest daily-use value
3. Stock history modal component
4. Sidebar low-stock badge
5. Reports API endpoint
6. Reports page UI
7. Email lib (Resend setup)
8. Settings page
9. Wire email trigger in orders endpoint
10. Update dashboard top-products chart
