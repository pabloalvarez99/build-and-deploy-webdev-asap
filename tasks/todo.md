# ERP Fase 1 — Módulo Proveedores + Compras

## Objetivo
Implementar el módulo de gestión de proveedores y órdenes de compra con OCR de facturas via cámara.

## Stack relevante
- Prisma 7 + Cloud SQL PostgreSQL 15
- Next.js 14 App Router (Client Components en admin)
- Google Cloud Vision API (ya configurada: `GOOGLE_CLOUD_VISION_API_KEY`)
- Patrón auth: `getAdminUser()` → Prisma CRUD → serialize → JSON

---

## Tareas

### Paso 1: Migración Prisma ← PRIMERO
- [ ] Agregar `cost_price Decimal? @db.Decimal(10,2)` al modelo `products`
- [ ] Agregar relaciones inversas en `products`: `purchase_order_items[]` + `supplier_product_mappings[]`
- [ ] Crear modelo `suppliers`
- [ ] Crear modelo `purchase_orders` (FK → suppliers)
- [ ] Crear modelo `purchase_order_items` (FK → purchase_orders + products nullable)
- [ ] Crear modelo `supplier_product_mappings` (unique: supplier_id + supplier_code)
- [ ] Ejecutar `prisma migrate dev --name erp_fase1` contra Cloud SQL
- [ ] Verificar con `prisma studio` o query directa que las tablas existen

### Paso 2: API Suppliers CRUD
- [ ] `GET /api/admin/suppliers` → lista con count de OCs
- [ ] `POST /api/admin/suppliers` → crear proveedor
- [ ] `GET /api/admin/suppliers/[id]` → detalle + historial OCs
- [ ] `PUT /api/admin/suppliers/[id]` → actualizar
- [ ] `DELETE /api/admin/suppliers/[id]` → eliminar (solo si no tiene OCs)

### Paso 3: Página /admin/proveedores
- [ ] Lista de proveedores (card grid): nombre, RUT, contacto, # OCs, último pedido
- [ ] Form inline (modal) para crear/editar proveedor
- [ ] Confirmación eliminar
- [ ] Botón "Ver compras" → link a `/admin/compras?supplier_id=xxx`

### Paso 4: API Purchase Orders Scan (OCR)
- [ ] `POST /api/admin/purchase-orders/scan` → recibe imagen base64
  - Llama Vision API TextDetection
  - Parser heurístico: extrae líneas con código, descripción, cantidad, precio
  - Para cada línea: busca en `supplier_product_mappings` → asigna product_id si match
  - Devuelve array de líneas con { supplier_code, product_name_invoice, quantity, unit_cost, product_id, product_name_matched }

### Paso 5: API Purchase Orders CRUD + Receive
- [ ] `GET /api/admin/purchase-orders` → lista con filtros (supplier, status, fecha)
- [ ] `POST /api/admin/purchase-orders` → crear OC en draft con items
- [ ] `GET /api/admin/purchase-orders/[id]` → detalle + items + proveedor
- [ ] `PUT /api/admin/purchase-orders/[id]` → actualizar OC / items
- [ ] `POST /api/admin/purchase-orders/[id]/receive` → CONFIRMAR RECEPCIÓN:
  - Incrementa `stock` en cada `product_id` mapeado
  - Actualiza `cost_price` en `products`
  - Crea registros en `stock_movements` (reason: 'purchase')
  - Guarda nuevos `supplier_product_mappings` detectados
  - Cambia status OC a 'received'
- [ ] `POST /api/admin/purchase-orders/[id]/map-product` → guarda mapeo manual supplier_code → product_id

### Paso 6: Página /admin/compras/nueva (flujo multi-step)
- [ ] Step 1 — Seleccionar proveedor (dropdown o crear nuevo inline)
- [ ] Step 2 — Foto factura: `<input capture="environment">` + preview + botón "Escanear"
- [ ] Step 3 — Tabla OCR: líneas verdes (auto-reconocidas) + naranjas (requieren mapeo)
  - Líneas naranjas: search inline para buscar producto en catálogo
- [ ] Step 4 — Resumen: total calculado + botón "Confirmar recepción"
- [ ] POST a /receive → redirigir a /admin/compras/[id]

### Paso 7: Páginas /admin/compras y /admin/compras/[id]
- [ ] `/admin/compras` → lista OCs (filtros: proveedor, status, fecha), paginación
- [ ] `/admin/compras/[id]` → detalle: foto factura, tabla items, proveedor, botones estado

### Paso 8: Actualizar Sidebar y Nav
- [ ] Agregar "Proveedores" (icono Truck) en `Sidebar.tsx`
- [ ] Agregar "Compras" (icono ClipboardList) con badge de OCs en draft
- [ ] Actualizar mobile bottom nav con los 2 nuevos items

---

## Decisiones de diseño

- **OCR endpoint**: usar `GOOGLE_CLOUD_VISION_API_KEY` REST (igual que scan-invoice actual, sin SDK)
- **ScanInvoiceModal existente**: NO reusar para compras (diseñado para single-product). Crear nuevo componente `PurchaseOrderScanStep`.
- **Migración**: `prisma migrate dev` (local con DATABASE_URL apuntando a Cloud SQL directamente)
- **Storage de foto factura**: por ahora guardar como base64 en `ocr_raw` o skip storage — `image_url` queda null en draft (Firebase Storage es opcional Fase 1)
- **Sidebar badges**: badge en "Compras" muestra count de OCs en status 'draft'

---

## Review
_Completar al terminar_
