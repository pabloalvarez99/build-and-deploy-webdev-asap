# ERP Operaciones Farmacia — Plan de Implementación

**Spec:** `pharmacy-ecommerce/apps/web/docs/superpowers/specs/2026-04-26-erp-operaciones-farmacia.md`
**Fecha:** 2026-04-26

---

## Estado actual

- `/admin/operaciones` muestra KPIs de ventas hoy/ayer, stock crítico, faltas, reservas expiradas/urgentes, OC en borrador, vencimientos. Sin P&L ni metas.
- `/admin/pos` tiene modal de confirmación de receta (`prescription_type: 'required' | 'controlled'`) — solo un warning, NO registra datos de receta ni paciente en BD.
- `admin_settings` acepta claves key/value — ya usa `alert_email`, `low_stock_threshold`, `pharmacy_name`, `pharmacy_address`, `pharmacy_phone`. Listo para `daily_sales_target` y `monthly_sales_target`.
- `products.cost_price` existe en schema pero no se usa en cálculos de P&L.
- No existen tablas `prescription_records` ni `pharmacist_shifts`.
- No existe `/admin/libro-recetas` ni `/api/admin/prescriptions`.
- No existe `/api/cron/daily-summary`.
- `/admin/reposicion` existe pero sin modal de "pedido express".
- `vercel.json` tiene cron para `cleanup-orders`; hay que agregar `daily-summary`.
- `caja_cierres` tiene `notas` y `cerrado_por` pero no tiene campo para turno farmacéutico.

---

## Features del spec (en orden de prioridad/dependencias)

---

### 1. P&L + Metas de Ventas en `/admin/operaciones`

**Archivos a modificar:**
- `pharmacy-ecommerce/apps/web/src/app/api/admin/operaciones/route.ts` — agregar queries P&L (costo ventas hoy, ventas mes) y lookup de `daily_sales_target`/`monthly_sales_target` en `admin_settings`; añadir campos `pl` y `metas` al response JSON
- `pharmacy-ecommerce/apps/web/src/app/admin/operaciones/page.tsx` — agregar tipos `pl` y `metas` a `DashData`; renderizar bloque metas con barra de progreso (verde/amber/rojo) y bloque P&L con margen bruto; banner amber si `!pl.costo_calculable`

**Pasos:**
- [ ] Leer `pharmacy-ecommerce/apps/web/src/app/api/admin/operaciones/route.ts` antes de editar
- [ ] Agregar al `Promise.all` existente: query `costo_hoy` (JOIN order_items + products + orders, filtro hoy + status paid/completed), query `ventas_mes` + `ordenes_mes` (mes actual), lookup de settings `daily_sales_target` y `monthly_sales_target`
- [ ] Calcular `margen_bruto_hoy = ventas_hoy - costo_hoy`, `margen_pct_hoy`, `costo_calculable = costo_hoy > 0`; calcular `pct_diario` y `pct_mensual` si metas existen
- [ ] Añadir campos `pl` y `metas` al objeto de respuesta
- [ ] En `operaciones/page.tsx`: extender `DashData` con tipos `pl` y `metas`; agregar bloque "Meta del día" con barra de progreso + colores condicionales (verde >=80%, amber 50-79%, rojo <50%); agregar tarjetas "Margen bruto hoy" y "Costo ventas hoy"; mostrar banner amber si `!pl.costo_calculable`

---

### 2. Metas de Ventas en `/admin/configuracion`

**Archivos a modificar:**
- Página de configuración admin (buscar con Glob `**/configuracion*`) — agregar sección "Metas de Ventas" con inputs para meta diaria y mensual en CLP; guardar con `PATCH /api/admin/settings`

**Pasos:**
- [ ] Buscar la página de configuración actual con Glob (`**/configuracion*`)
- [ ] Leer el archivo antes de editar
- [ ] Agregar sección "Metas de Ventas" con dos inputs numéricos: `daily_sales_target` y `monthly_sales_target`
- [ ] Al guardar, llamar `PATCH /api/admin/settings` con las nuevas claves (el endpoint ya existe en `src/app/api/admin/settings/route.ts`)

---

### 3. Schema Migration — 2 tablas nuevas

**Archivos a modificar:**
- `pharmacy-ecommerce/apps/web/prisma/schema.prisma` — agregar modelos `prescription_records` y `pharmacist_shifts`

**Pasos:**
- [ ] Agregar modelo `prescription_records` con campos: `id`, `order_id` (nullable FK → orders), `product_id` (nullable FK → products), `product_name`, `quantity`, `prescription_number`, `patient_name`, `patient_rut`, `doctor_name`, `medical_center`, `prescription_date`, `is_controlled`, `dispensed_by`, `dispensed_at`; índices en `dispensed_at` y `patient_rut`
- [ ] Agregar modelo `pharmacist_shifts` con campos: `id`, `pharmacist_name`, `pharmacist_rut`, `shift_start`, `shift_end` (nullable), `notes`, `created_at`; índice en `shift_start`
- [ ] Agregar relaciones inversas `prescription_records prescription_records[]` en modelos `orders` y `products`
- [ ] Ejecutar migración con `prisma db push` contra Cloud SQL (protocolo: autorizar IP → push → limpiar IP)

---

### 4. Modal de Receta Completo en POS

**Archivos a modificar:**
- `pharmacy-ecommerce/apps/web/src/app/admin/pos/page.tsx` — reemplazar modal de simple confirmación por modal completo con campos del paciente; no skipeable si producto requiere receta retenida; guardar `pendingPrescriptions` para enviar al API post-venta

**Archivos a crear:**
- `pharmacy-ecommerce/apps/web/src/lib/controlled-substances.ts` — array `CONTROLLED_SUBSTANCES: string[]` con principios activos controlados (clonazepam, alprazolam, lorazepam, morfina, codeína, etc.)

**Pasos:**
- [ ] Crear `src/lib/controlled-substances.ts` con lista de principios activos (lowercase para comparación case-insensitive)
- [ ] En `pos/page.tsx`: verificar valores reales de `prescription_type` en BD; mapear a condición de trigger del modal
- [ ] Reemplazar state `prescriptionPending: Product | null` por `prescriptionModal: { product: Product; fields: PrescriptionFields } | null`
- [ ] Agregar interface `PrescriptionFields`: `prescription_number`, `patient_name` (requerido), `patient_rut`, `doctor_name`, `medical_center`, `prescription_date`
- [ ] Agregar state `pendingPrescriptions: PrescriptionData[]` para acumular registros del turno
- [ ] Leer `localStorage.getItem('pharmacist_name')` al montar para pre-llenar `dispensed_by`
- [ ] Modal: no tiene botón "Cerrar" activo sin `patient_name` — `Confirmar venta` deshabilitado mientras `!fields.patient_name`; `Cancelar` cancela agregar el producto
- [ ] Badge "Psicotrópico/Estupefaciente" si `active_ingredient` matchea algún valor en `CONTROLLED_SUBSTANCES`
- [ ] En `handleSale()`: tras POST exitoso a `/api/admin/pos/sale`, hacer `POST /api/admin/prescriptions` con array de registros; limpiar `pendingPrescriptions`

---

### 5. API Libro de Recetas

**Archivos a crear:**
- `pharmacy-ecommerce/apps/web/src/app/api/admin/prescriptions/route.ts` — `GET` lista paginada con filtros; `POST` crea registro en `prescription_records`
- `pharmacy-ecommerce/apps/web/src/app/api/admin/prescriptions/export/route.ts` — `GET` devuelve CSV de registros filtrados

**Pasos:**
- [ ] Crear `route.ts` en `/api/admin/prescriptions/`: `GET` con `getAdminUser()` + query Prisma con filtros (`from`, `to`, `product_name`, `is_controlled`, `page`, `limit`) + paginación; devolver también `kpis: { hoy, mes }`
- [ ] `POST`: validar body (requiere `product_name`, `patient_name`, `quantity`); calcular `is_controlled` en server si no viene en el body
- [ ] Crear `export/route.ts`: query sin paginación, generar CSV con cabeceras en español, `Content-Type: text/csv`, `Content-Disposition: attachment; filename=recetas-[fecha].csv`

---

### 6. Página `/admin/libro-recetas`

**Archivos a crear:**
- `pharmacy-ecommerce/apps/web/src/app/admin/libro-recetas/page.tsx` — tabla de registros con filtros y export

**Pasos:**
- [ ] Crear `page.tsx` con `'use client'`; estado: `records`, `loading`, `filters` (dateFrom, dateTo, productSearch, isControlled)
- [ ] KPI header: recetas hoy / recetas mes
- [ ] Tabla: columnas fecha+hora, producto, paciente, RUT, médico, nro receta, dispensado por, tipo (badge rojo si controlado)
- [ ] Filtros: date range inputs, input búsqueda producto, checkbox "Solo controlados"
- [ ] Botón "Exportar CSV" → `GET /api/admin/prescriptions/export?...` con params actuales
- [ ] Botón "Imprimir" → `window.print()` con CSS `@media print` que oculta filtros, botones y sidebar admin
- [ ] Agregar link "Libro de recetas" en navegación de admin (buscar sidebar/bottom-nav en `src/components/admin/` o `src/app/admin/layout.tsx`)

---

### 7. Turno Farmacéutico en `/admin/arqueo`

**Archivos a modificar:**
- `pharmacy-ecommerce/apps/web/src/app/admin/arqueo/page.tsx` — agregar sección turno farmacéutico con botón "Iniciar turno", modal nombre+RUT, mostrar farmacéutico activo, cerrar turno con notas

**Archivos a crear:**
- `pharmacy-ecommerce/apps/web/src/app/api/admin/arqueo/shift/route.ts` — `GET` turno activo del día; `POST` crea nuevo turno; `PATCH` cierra turno activo

**Pasos:**
- [ ] Leer `arqueo/page.tsx` y `api/admin/arqueo/route.ts` antes de editar
- [ ] Crear `shift/route.ts`: `GET` → último turno con `shift_end IS NULL` del día actual; `POST` → crea `pharmacist_shifts`; `PATCH` → `shift_end = now()` + notas opcionales
- [ ] En `arqueo/page.tsx`: agregar state `activeShift`, `showShiftModal`; al montar, GET al `/api/admin/arqueo/shift`
- [ ] Botón "Iniciar turno" → modal con inputs `pharmacist_name` + `pharmacist_rut` → POST; guardar `localStorage.setItem('pharmacist_name', name)`
- [ ] Mostrar nombre del farmacéutico activo en la UI del arqueo
- [ ] Al cerrar turno: textarea para notas → PATCH; `localStorage.removeItem('pharmacist_name')`

---

### 8. Cron Resumen Nocturno

**Archivos a crear:**
- `pharmacy-ecommerce/apps/web/src/app/api/cron/daily-summary/route.ts` — handler del cron nocturno

**Archivos a modificar:**
- `pharmacy-ecommerce/apps/web/vercel.json` — agregar entrada de cron `0 2 * * *`

**Pasos:**
- [ ] Leer `vercel.json` para ver estructura actual de crons
- [ ] Leer `src/app/api/cron/cleanup-orders/route.ts` como referencia del patrón de autenticación con `CRON_SECRET`
- [ ] Crear `daily-summary/route.ts`: verificar `Authorization: Bearer ${process.env.CRON_SECRET}`; queries en paralelo: ventas hoy + ayer (delta%), margen bruto (si cost_price), meta diaria (pct alcanzado), último cierre de caja del día, top 5 productos hoy, reservas que expiran en <12h, stock=0 count, faltas pendientes con stock
- [ ] Obtener `alert_email` de `admin_settings`; si no existe, return 200 sin enviar
- [ ] Generar HTML del email con secciones del spec; enviar con `resend.emails.send(...)`
- [ ] Agregar en `vercel.json`: `{ "path": "/api/cron/daily-summary", "schedule": "0 2 * * *" }` al array `"crons"`

---

### 9. Pedido Express Proveedor en `/admin/reposicion`

**Archivos a modificar:**
- `pharmacy-ecommerce/apps/web/src/app/admin/reposicion/page.tsx` — agregar botón "Enviar pedido" por grupo de proveedor; modal con lista editable + botones "Crear OC + Copiar para WhatsApp" y "Enviar por email"

**Pasos:**
- [ ] Leer `reposicion/page.tsx` para entender estructura actual de grupos por proveedor
- [ ] Agregar state: `showExpressModal: boolean`, `expressSupplier: Supplier | null`, `expressItems: { product_id, product_name, qty_suggested, qty_to_order }[]`
- [ ] Botón "Enviar pedido" junto a cada sección de proveedor → poblar `expressItems` con productos del grupo + cantidades sugeridas → abrir modal
- [ ] Modal: tabla editable con cantidad por producto (inputs numéricos); botón "Crear OC + Copiar para WhatsApp":
  - `POST /api/admin/purchase-orders` con `status: 'draft'`, `supplier_id`, items
  - Generar texto: `"Pedido Tu Farmacia — [fecha]\nProveedor: [nombre]\n\n- [producto] — Qty: [N]\n...Total ítems: N"`
  - `navigator.clipboard.writeText(texto)` → toast "Copiado al portapapeles"
- [ ] Botón "Enviar por email": `window.open('mailto:...')` con el mismo texto como body; deshabilitar si proveedor no tiene `contact_email`

---

## Schema changes requeridos

### Tablas nuevas (migración con `prisma db push`)

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

### Nuevas claves en `admin_settings` (sin migración — insertar on-demand)
- `daily_sales_target` — meta de ventas diaria en CLP (string numérico)
- `monthly_sales_target` — meta de ventas mensual en CLP (string numérico)

### Relaciones inversas a agregar en modelos existentes
- En `orders`: agregar `prescription_records prescription_records[]`
- En `products`: agregar `prescription_records prescription_records[]`

---

## Gotchas a considerar

1. **`prescription_type` en BD**: Los valores actuales en schema default son `'direct'`; el modal POS existente usa `'required'` y `'controlled'`. El spec habla de `'retenida'` y `'magistral'`. Verificar con `SELECT DISTINCT prescription_type FROM products` antes de escribir la condición del modal.
2. **`orders.user_id` es `@db.Uuid`**: Las órdenes de POS usan `user_id = NULL`. El campo `order_id` en `prescription_records` es nullable — correcto.
3. **Cron 02:00 UTC** = 22:00-23:00 hora Chile. El resumen nocturno llega cuando el día comercial ya cerró.
4. **`navigator.clipboard.writeText`** requiere HTTPS o localhost — funciona en Vercel producción.
5. **`window.print()` para libro-recetas**: agregar `@media print` CSS para ocultar sidebar admin, botones y filtros; solo mostrar tabla.
6. **localStorage `pharmacist_name`**: leer al montar POS en `useEffect` para pre-llenar `dispensed_by` en el modal de receta.
7. **Email nocturno sin ventas**: enviar igual con ventas = $0 para que el dueño vea días sin actividad.
8. **P&L `costo_calculable`**: usar `costo_hoy > 0` como proxy — no garantiza que todos los productos tienen cost_price pero evita falso positivo con `COALESCE(..., 0)`.
9. **`getDb()` es async**: siempre `await getDb()` en las nuevas API routes.

---

## Orden de implementación recomendado

| # | Feature | Dependencias | Est. |
|---|---------|--------------|------|
| 1 | P&L + metas en `/admin/operaciones` | Ninguna | 2-3h |
| 2 | Metas en `/admin/configuracion` | Feature 1 (mismas settings keys) | 1h |
| 3 | Schema migration (2 tablas nuevas) | Prerrequisito para 4, 5, 6, 7 | 30m |
| 4 | Modal receta completo en POS | Feature 3 | 2h |
| 5 | API libro de recetas | Feature 3 | 2h |
| 6 | Página `/admin/libro-recetas` | Feature 5 | 2h |
| 7 | Turno farmacéutico en arqueo | Feature 3 | 2h |
| 8 | Cron resumen nocturno | Features 1+2 (para incluir metas) | 2h |
| 9 | Pedido express proveedor | Ninguna | 2h |

**Total estimado: ~15.5h**

### Notas de secuencia
- Features 1 y 2 son independientes entre sí; conviene hacerlas en la misma sesión.
- Feature 3 (migración DB) debe preceder a 4, 5, 6 y 7. Agrupar migración + feature 4 en una sesión para no hacer dos ventanas de autorización de IP en Cloud SQL.
- Features 5 y 6 van en la misma sesión (API + UI del libro de recetas).
- Feature 8 puede hacerse sin features 1+2 usando fallback `if (!meta) skip meta section in email`.
- Feature 9 es completamente independiente; puede implementarse en cualquier orden.
