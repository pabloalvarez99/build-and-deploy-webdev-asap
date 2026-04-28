# Bitácora: Tu Farmacia - E-commerce de Farmacia

## Estado actual: Roles ERP + Gestión Financiera completos (Abril 2026)

---

## 2026-04-28 — Feat: Admin Console redesign + roles + invitaciones

- **Diseño aislado del storefront**: nuevo `apps/web/src/app/admin/admin.css` con tokens scoped a `[data-admin="1"]`. Canvas zinc/violeta, paleta dark `#0b0b0f / #111118 / #16161f`, accent indigo→violet (en lugar de emerald). Tipografía 14–15px tabular. Motion `cubic-bezier(0.16,1,0.3,1)`.
- **Sidebar agrupado** (`Sidebar.tsx` reescrito): 8 grupos colapsables (Operación · Catálogo · Ventas · Compras · Inventario · Farmacia · Finanzas · Sistema). Estado por grupo persistido en `localStorage`. Grupo se oculta completo si `canAccessRoute` no deja items visibles. Brand "Tu Farmacia · Console" + footer con avatar + RoleBadge.
- **Layout shell** (`admin/layout.tsx`): topbar refinado con search central (320–420px), badge "Producción" cuando hostname coincide con prod, avatar con iniciales + chip de rol. `max-w-screen-2xl`, padding `lg:p-10`, `admin-fade-in` por route.
- **Primitivos compartidos** (`components/admin/ui/`): `PageHeader`, `Card`, `StatCard` (con delta + sparkline slot), `DataTable`, `EmptyState`, `RoleBadge`. Adoptados en Dashboard, Productos y Usuarios; resto migrará incrementalmente.
- **Roles polish** (`lib/roles.ts`): nuevos `roleLabel`, `roleDescription`, `routesForRole`, `routesLostOnDemotion`. Sets `SELLER_ROUTES`/`PHARMACIST_EXTRA_ROUTES`/`OWNER_ONLY_ROUTES` ahora `export`.
- **Gestión de Usuarios** (`/admin/usuarios` rewrite + nuevos endpoints):
  - `POST /api/admin/users/invite`: crea Firebase user, asigna rol via custom claim, devuelve `generatePasswordResetLink`.
  - `PATCH /api/admin/users/[uid]`: enable/disable usuario.
  - UI: search en vivo, segmented filter por rol, modal de invitación (email + nombre + rol con descripción), modal de confirmación al demotear (lista las rutas que se pierden), toggle disable, columna "último ingreso" (relativa) y "creado", auto-protección (no puedes cambiar tu propio rol ni deshabilitarte).
- **Dashboard** (`admin/page.tsx`): adoptó `PageHeader` + `StatCard`. Fix bug `user.role !== 'admin'` → `isAdminRole(user.role)` (antes bloqueaba a owners/pharmacists/sellers en cliente).

---

## 2026-04-28 — Perf: Caché Next.js + Edge Config + Índices DB

- **`unstable_cache`** en `/api/products` (300s, tag `products`), `/api/products/[slug]` (600s), `/api/products/filters` (1800s). Rutas dinámicas (search/barcode) no cacheadas.
- **`revalidateTag('products')`** en todos los endpoints de mutación: admin/products CRUD, import, bulk-price, update-prices, stock, stock-movements/adjust, purchase-orders receive, pos/sale, webpay/return.
- **`revalidateTag('categories')`** en admin/categories/[id] PUT+DELETE.
- **Edge Config** (`@vercel/edge-config`) para `admin_settings` GET: sub-1ms vs DB round-trip. Fallback a DB + backfill automático. PATCH escribe DB (fuente de verdad) + `updateEdgeConfig` no-bloqueante. `VERCEL_API_TOKEN` en Vercel.
- **Índice DB**: `idx_products_active_stock ON products(active, stock DESC)` — query inventario valorizado 48ms → <1ms.
- **Skipped**: ISR homepage (es `'use client'`), lazy firebase-admin (ya lazy), Upstash Redis (sin credenciales; `unstable_cache` cubre el caso hot-products).

---

## 2026-04-27 — Feat: Módulo Gestión Financiera

- **Schema**: 4 tablas nuevas (`purchase_payments`, `gasto_categories`, `gastos`, `recurring_expenses`) + 4 campos en `purchase_orders` (`paid`, `paid_at`, `payment_method_ap`, `due_date`). Seed: 11 categorías fijas.
- **Cuentas por Pagar** (`/admin/finanzas/cuentas-pagar`): lista OC received con estado pago, vencimiento, abonos parciales. Modal para registrar pagos/abonos con `mark_fully_paid`.
- **Gastos** (`/admin/finanzas/gastos`): CRUD gastos por mes + plantillas recurrentes (generar gasto del mes con un clic, día_del_mes 1-28).
- **P&L** (`/admin/finanzas/pyl`): mensual + YoY + YTD. BarChart Recharts. Tabla con % cambio anual.
- **Cash Flow** (`/admin/finanzas/cash-flow`): 30d reales (ingresos + pagos) + 30d proyección (OC vencimiento + recurrentes). AreaChart.
- **Dashboard** (`/admin/finanzas`): 4 KPIs mes en curso (OC pendientes, gastos, ingresos, margen bruto).
- **Acceso**: owner-only (`getOwnerUser()`). Sidebar filtra `/admin/finanzas` para owner.

---

## 2026-04-27 — Feat: Sistema de Roles y Permisos ERP

- **Roles**: `owner` (dueño), `pharmacist` (farmacéutico), `seller` (vendedor) en Firebase custom claims. `admin` legacy tratado como `owner`.
- **`roles.ts`**: `isAdminRole`, `isOwnerRole`, `canAccessRoute` — control centralizado de acceso por ruta.
- **`api-helpers.ts`**: `getAdminUser` acepta 3 roles + nuevo `getOwnerUser` + campo `name` en `DecodedUser`.
- **Sidebar**: filtra navItems según rol. Seller ve 7 items. Pharmacist ve 18. Owner ve todo.
- **API protection**: `getOwnerUser()` protege reportes, proveedores, compras, finanzas.
- **POS trazabilidad**: `sold_by_user_id` + `sold_by_name` en tabla `orders` (DB migration). Cada venta POS registra quién vendió.
- **POS UI**: muestra nombre del vendedor activo en el header.
- **Gestión Usuarios** (`/admin/usuarios`): lista todos los usuarios Firebase. Owner puede asignar roles con dropdown. Sección equipo vs clientes.
- **Badge de rol** en header del admin (visible desktop).

---

## Estado actual: Cierre de caja POS completo — pos_mixed + Z-report + shift awareness (Abril 2026)

---

## 2026-04-26 — Feat: Cierre de caja POS — plan completo (6 tareas)

### Task 1: DB schema en producción
- `caja_cierres` model verificado en `prisma/schema.prisma` — campos: `id`, `turno_inicio`, `turno_fin`, `fondo_inicial`, `ventas_efectivo`, `ventas_debito`, `ventas_credito`, `ventas_total`, `num_transacciones`, `efectivo_esperado`, `efectivo_contado`, `diferencia`, `notas`, `cerrado_por`, `created_at`
- `prisma db push` aplicado a Cloud SQL producción (`tu-farmacia-prod:southamerica-east1:tu-farmacia-db`)

### Task 2+3: pos_mixed en API arqueo + tipo ShiftData
- `GET /api/admin/arqueo`: filtro `payment_provider` ampliado a `['pos_cash','pos_debit','pos_credit','pos_mixed']`
- `select` incluye `cash_amount` y `card_amount` para splits de ventas mixtas
- Cálculo: `pos_mixed` suma `cash_amount` a efectivo y `card_amount` a débito/crédito
- `ShiftData.ventas.mixto: number` agregado al tipo en `arqueo/page.tsx`
- Card "Mixto" (Shuffle icon, purple) en KPI row del arqueo

### Task 4: Z-report imprimible
- `arqueo/page.tsx`: botón `Printer` en header → `window.print()`
- `<div id="zreport-print">`: oculto en pantalla, visible solo en `@media print` (posición fixed, fondo blanco, monospace)
- Contenido: nombre farmacia, fecha, turno inicio→fin, quién cerró, fondo inicial, desglose ventas (efectivo/débito/crédito/mixto/total), efectivo esperado/contado/diferencia

### Task 5: POS shift-awareness + prescription modal

**`/admin/pos`:**
- Banner ámbar cuando `fondo_inicial === 0` → "Configura el fondo antes de iniciar ventas" + link a Arqueo
- Modal de confirmación de receta al agregar `prescription_type: 'required' | 'controlled'` al carrito (primera vez): muestra tipo, nombre, botones Cancelar / "Receta verificada ✓"
- `addToCartDirect()` separado de `addToCart()` para bypass del modal en confirmación

**`/admin/operaciones`:**
- Card "Estado de caja": fondo inicial, hora inicio turno, ventas POS del día
- Ícono ámbar si fondo=0, esmeralda si configurado; link a `/admin/arqueo`
- `Promise.all` paralelo: operaciones + arqueo en un solo `load()`

### Task 6: Build + deploy
- Build limpio sin errores TypeScript
- `git push origin main` → Vercel auto-deploy

---

## 2026-04-26 — Feat: POS shift-awareness + caja status en operaciones

**`/admin/pos`:**
- Banner ámbar en POS cuando `fondo_inicial === 0` → alerta "Configura el fondo antes de iniciar ventas" con link a Arqueo
- Modal de confirmación de receta al agregar medicamentos `required` o `controlled` al carrito (primera vez): muestra nombre, tipo de receta requerida, botones Cancelar / "Receta verificada ✓"
- `addToCartDirect()` separado de `addToCart()` para que el modal confirme y llame directo

**`/admin/operaciones`:**
- Card "Estado de caja" con fondo inicial, hora de inicio de turno y resumen de ventas POS del día
- Ícono Banknote ámbar si fondo=0, esmeralda si configurado
- Clickeable → link a `/admin/arqueo`
- `Promise.all` paralelo: operaciones + arqueo en un solo `load()`

---

## 2026-04-26 — Feat: Búsqueda semántica por principio activo / acción terapéutica

- `GET /api/products?search=X` ya buscaba en `name`, `active_ingredient`, `therapeutic_action`, `laboratory`
- Nuevo: cada producto en el response incluye `match_field` (`'active_ingredient' | 'therapeutic_action' | 'laboratory' | null`) y `match_value` (valor del campo)
- Homepage: badge azul en cada card indicando por qué coincidió (solo cuando `match_field ≠ null`, es decir, no es match por nombre)
- Homepage: banner de contexto encima de resultados cuando hay matches semánticos
- Badge visible en vista grid y vista lista
- Sin cambio de schema DB — ILIKE en 4 campos, anotación en JS post-fetch

---

## 2026-04-26 — Feat: Dashboard Operacional Diario

**`/admin/operaciones`** — Vista matutina unificada para el dueño/farmacéutico:

- **API `GET /api/admin/operaciones`**: un solo endpoint con `Promise.all` de 12 queries paralelas — reservas expiradas, reservas urgentes (<6h), vencidos con stock, lotes por vencer en 7d, faltas con stock disponible, OC borrador, counts de stock crítico/cero, KPIs hoy/ayer, webpay pendientes.
- **Sección Crítico (rojo)**: reservas expiradas sin procesar + productos vencidos con stock. Cada item enlaza directo al detalle.
- **Sección Urgente (amber)**: reservas por expirar pronto, faltas cuyo producto ya llegó al stock (con botón llamada directa al cliente), OC en borrador sin confirmar.
- **Sección 7 días (naranja)**: lotes próximos a vencer.
- **KPI cards**: ventas hoy vs ayer con badge ▲/▼ %, total pedidos, stock crítico count, faltas pendientes.
- **Acciones rápidas**: 6 links con badges de alerta (POS, Órdenes, Arqueo, Reposición, Faltas, Vencimientos).
- **Auto-refresh** cada 60s. Sidebar: nuevo link "Operaciones" (Activity icon) entre Dashboard y POS.

---

## Decisiones de producto (2026-04-26)

**Sin delivery** — La farmacia no ofrece despacho a domicilio. Todos los pedidos son retiro en tienda o pago Webpay para retiro. No agregar flujo de delivery ni campo de dirección de envío.

---

## 2026-04-26 — Fix: Admin navbar — mobile drawer + desktop toggle unificado

**Problema:** Bottom nav móvil tenía 22 items en `flex h-16` → inutilizable. Toggle desktop usaba sync frágil (2 estados separados + localStorage + custom events).

**`src/components/admin/Sidebar.tsx`:**
- Eliminado bottom nav móvil (22 items imposibles en una barra)
- Nuevo slide-out drawer móvil: overlay backdrop, cierra con ESC/backdrop/navegación
- Estado interno `isCollapsed` eliminado → ahora recibe props (`isCollapsed`, `onToggle`, `mobileOpen`, `onMobileClose`)
- Toggle en header del sidebar (ChevronLeft/Right) para desktop
- `NavItem` extraído como subcomponente local

**`src/app/admin/layout.tsx`:**
- Estado unificado: layout es owner de `sidebarCollapsed` + `mobileOpen`
- Eliminada sincronización via custom events y `window.addEventListener('sidebar-collapse')`
- `handleSidebarToggle()` único punto de escritura a localStorage
- Botón hamburger `☰` (Menu icon) visible solo en mobile (`lg:hidden`)
- Eliminado `pb-16` del main (ya no hay bottom nav)

---

## 2026-04-26 — Feat: Image upload, inline edit precio/descuento, repetir pedido en lista

**Admin productos — upload imagen a Firebase Storage:**
- `src/lib/firebase/storage.ts`: nueva función `uploadProductImage(file, productId)` → path `products/{id}/{ts}_{filename}`
- `src/app/admin/productos/page.tsx`: botón "Subir imagen" con spinner, input file oculto, escribe URL Firebase en `formData.image_url` al completar

**Admin productos — edición inline precio y descuento:**
- Precio ya tenía inline edit (`editingPriceId`). Agregado `editingDiscountId` con misma lógica.
- Click en badge descuento → input 0-100 → Enter/blur guarda via `PUT /api/admin/products/[id]`

**Mis pedidos (lista) — botón "Repetir":**
- `GET /api/orders` ahora incluye `order_items` (Prisma `include`)
- `src/lib/api.ts`: tipo `OrderWithItems` para lista paginada
- `src/app/mis-pedidos/page.tsx`: botón "Repetir" en cada card → `addToCart` por ítem → router `/carrito`

---

## 2026-04-21 — Data: Import Catálogo Completo ERP (34,107 productos)

**Script `pharmacy-ecommerce/scripts/import_backup_productos.mjs`**:
- Parseó `BACKUP_PRODUCTOS.txt` (backup ERP Golan/EcoSur, 34,107 productos únicos)
- Actualizó 1,504 productos existentes (name + price si backup tiene precio)
- Insertó 32,603 nuevos productos con `external_id` del ERP
- Activos (con PVP): 24,933 | Inactivos (sin precio): 9,176
- `barcode_catalog`: 39,288 entradas (EAN completos para lookup POS sin FK)
- `product_barcodes`: 39,288 entradas (vinculadas a products.id)
- Multi-barcode correctamente separados por `|`

---

## 2026-04-20 — Feat: Panel Fidelización Admin

**Panel `/admin/fidelidad`**:
- API `GET /api/admin/loyalty/stats` — KPIs (miembros con puntos, puntos pendientes, valor CLP, tasa de canje), top 10 clientes por puntos, últimas 20 transacciones del programa, datos mensuales otorgados/canjeados (raw SQL, últimos 6 meses)
- Página `/admin/fidelidad` — 4 KPI cards, BarChart Recharts (otorgados vs canjeados por mes), ranking top 10 clientes con medallas #1/#2/#3, feed últimas 20 transacciones con íconos +/- y fecha
- Sidebar: link "Fidelización" con Star icon entre Clientes y Categorías

---

## 2026-04-19 — Feat: FASE E — Comparador de Precios Proveedores

**FASE E — Comparador de Precios** (`/admin/compras/comparador`):
- API `/api/admin/supplier-prices` GET+POST — lista y upsert precios por proveedor+producto
- API `/api/admin/supplier-prices/import` POST — importa Excel con columnas `codigo`/`producto` + `precio`; mapea via `supplier_product_mappings` con fallback por nombre de producto
- API `/api/admin/supplier-prices/compare` GET — agrupa todos los precios por producto, calcula mejor proveedor, peor precio, ahorro potencial (%)
- Página `/admin/compras/comparador` — tabla expandible con precios por proveedor, badge "MEJOR", columna margen vs PVP, upload Excel por proveedor, modal para agregar precio manual con búsqueda de producto
- Sidebar: nuevo link "Comparador" con ícono Scale entre Compras
- Reposición integrada: cada producto en `/admin/reposicion` muestra "Mejor proveedor: X ($precio, N% ahorro)"

---

## 2026-04-19 — Feat: Fases A-D del plan Reemplazar Golan

**FASE A — Análisis de Costos** (`/admin/costos`):
- Calculadora de margen neto por producto incluyendo overhead operacional proporcional
- Semáforo verde/amarillo/rojo según margen neto
- Simulador de descuento: drag slider → ve qué pasa con los márgenes
- Configuración de costos fijos: arriendo, sueldos, contador, ERP, otros
- Exportar CSV

**FASE B — Cuaderno de Faltas** (`/admin/faltas`):
- Nueva tabla `faltas` en Cloud SQL
- Registro de productos que clientes piden sin stock
- Badge en sidebar con count pendiente
- Auto-notificación: al recibir OC o ajustar stock positivo → falta → `notified`
- Botón "Falta" en POS cuando producto tiene stock=0

**FASE C — Vencimientos** (`/admin/vencimientos`):
- Nueva tabla `product_batches` en Cloud SQL
- KPIs: vencidos, vencen en 30d, 90d
- Acción "Liquidar" → aplica discount_percent en producto
- Acción "Dar de baja" → stock_movements reason=adjustment negativo
- Alertas cron: email cuando productos vencen en < 7 días

**FASE D — POS mejoras**:
- Pago mixto (pos_mixed): efectivo + tarjeta separados, campos cash_amount/card_amount en orders
- Bioequivalentes: botón "Alternativas" en productos con stock=0 → modal con mismo active_ingredient en stock
- Botón "Falta" en productos sin stock → abre /admin/faltas

**Nueva tabla**: `supplier_price_lists` (base para FASE E comparador de proveedores)

---

## 2026-04-18 — Feat: Fidelización omnipresente + Compra Rápida + mejoras admin

- **Carrito**: Preview "Ganarás X puntos" para usuarios registrados. CTA de registro con puntos estimados para usuarios anónimos.
- **Admin dashboard**: Comparación "vs ayer" en el card "Ventas hoy" con badge ▲/▼ % delta.
- **Homepage "Compra Rápida"**: Sección personalizada para usuarios con historial — muestra sus 6 productos más comprados con botón directo "Agregar". API nueva: `GET /api/products/frequent`.
- **POS fidelización**: Customer history API ahora retorna `user_id` y `loyalty_points` cuando el teléfono corresponde a un usuario registrado. POS pasa `customer_user_id` al crear la venta → puntos acreditados en ventas presenciales. Badge de puntos visible en el panel de cliente del POS.
- **Top sellers homepage**: Filtro mínimo $1.000 CLP aplicado. WhatsApp button reposicionado para no solapar "Cotizar".
- **Inventario admin**: Columna "Valor Retail" eliminada de la tabla (solo queda en KPI summary).

---

---

## 2026-04-17 — Feat: Tercera Edad UX + ERP ampliado

- **Homepage (cliente)**: Grid de productos 1 col mobile / 2 col tablet / 3 col desktop. Nombres `text-lg`, precios `text-2xl`, tarjetas más grandes. Categorías 1 col mobile, botones 64px height.
- **Carrito**: Nombre producto `text-base/text-lg`, precio unitario `text-base`, subtotal `text-xl` en verde.
- **Mis Pedidos**: Precio orden `text-2xl font-black`, status badges más grandes (`text-sm`, iconos `w-5`).
- **Producto detalle**: Productos relacionados 1 col mobile, precios `text-xl`, imágenes más grandes.
- **Reportes ERP**: Nuevo tab "Clientes" — KPIs únicos, distribución registrados/guests, top 10 clientes por gasto. API agrega `customerMetrics`.
- **Reportes ERP**: Gráfico de área "Ventas por hora del día" (UTC-4 Chile) para identificar picos de actividad. API agrega `salesByHour`.
- **Configuración admin**: Sección "Información de la Farmacia" (nombre, dirección, teléfono, web) — datos dinámicos en cotizaciones.
- **Cotización**: Carga datos de farmacia desde `admin_settings` en lugar de constantes hardcodeadas.

---

## 2026-04-17 — Feat: Inventario, retiros en POS, mejoras operacionales

- **Inventario (`/admin/inventario`)**: Nueva página con valorización de stock (retail + costo + margen), filtros por bajo stock / sin stock / sin costo, sorting multi-columna, export CSV. Tab "Sugerencias de reposición" agrupa productos bajo umbral por proveedor con link directo a contacto y OC.
- **POS retiros**: Botón "Retiro" en POS abre modal para buscar reservas por código de 6 dígitos. Muestra detalles del pedido, permite aprobar con un clic → descuenta stock, envía email, actualiza stats del turno.
- **Órdenes — expiry countdown**: Badge ⏱ en lista de órdenes para reservas pendientes (rojo si expirada, ámbar si < 6h).
- **Búsqueda por ID**: Orders API `/api/admin/orders` ahora permite buscar por ID parcial (startsWith).
- **Sidebar**: Agregado link "Inventario" (Warehouse icon) entre Stock y Reportes.
- **API**: `GET /api/admin/pos/pickup?code=XXXXXX` busca orden por código de retiro.

---

## 2026-04-16 — Feat: external_id y códigos de barra editables en formulario de productos

- **external_id**: ahora editable en el formulario tanto al crear como al editar un producto (antes solo lectura)
- **Barcodes**: UI de chips con botón × para eliminar, input para agregar por Enter o botón "Agregar"
- Un producto puede tener múltiples códigos EAN; se guardan en tabla `product_barcodes`
- API `POST /api/admin/products`: crea barcodes junto al producto en la misma operación
- API `PUT /api/admin/products/[id]`: reemplaza todos los barcodes atómicamente en transacción Prisma (deleteMany + createMany)
- `api.ts`: `CreateProductData` ahora incluye `external_id` y `barcodes` opcionales
- Regenerado el cliente Prisma (`prisma generate`) para incluir la relación `product_barcodes`
- Fix colateral: `email` en `storePickup` ahora es opcional en el tipo TypeScript

---

## 2026-04-11 — Feat: mock fallback en carrusel "Más vendidos"

- Agregado array `MOCK_TOP_SELLERS` con 8 productos farmacéuticos realistas (Paracetamol, Ibuprofeno, Omeprazol, Loratadina, Vitamina C, Metformina, Clonazepam, Amoxicilina) con precios CLP y algunos con descuento.
- El estado inicial de `topSellers` usa los mocks — el carrusel se muestra inmediatamente sin esperar la API.
- `loadTopSellers` solo reemplaza mocks si la API devuelve datos reales (`data.length > 0`).
- Permite visualizar el carrusel en producción aunque no haya historial de ventas aún.
- Build OK (57 páginas, 0 errores TypeScript).

---

## 2026-04-10 — Chore: desktop package-lock.json trackeado

- Agregado `pharmacy-ecommerce/apps/desktop/package-lock.json` al repo (antes sin trackear).
- Build web OK (57 páginas, 0 errores). Sin cambios funcionales.
- Push `d088f64` → Vercel no hace rebuild (archivo fuera del root dir configurado).

---

## 2026-04-10 — Fix: Admin order detail + POS Electron sin productos

**Bug fix — "Orden no encontrada" en detalle de orden admin:**
- Causa: `orderApi.get(id)` llamaba `GET /api/orders/[id]` que filtra `WHERE user_id = auth.uid()`.
  Las órdenes de otros usuarios son invisibles para el admin con ese endpoint.
- Fix: Nuevo `GET /api/admin/orders/[id]` (usa `getAdminUser`, sin filtro de user_id, incluye `order_items`).
- `api.ts`: nuevo `orderApi.adminGet(id)` → `/api/admin/orders/[id]`.
- `admin/ordenes/[id]/page.tsx`: usa `adminGet` en lugar de `get`.

**Bug fix — POS en Electron no muestra productos al buscar:**
- Causa: `main.js` tenía `APP_URL = 'https://tu-farmacia.cl'` (dominio no configurado en Vercel).
  Las llamadas a `/api/products` fallaban silenciosamente (catch vacío → array vacío → "Sin resultados").
- Fix: `APP_URL` corregido a `'https://tu-farmacia.vercel.app'`.
- Fix adicional: POS ahora muestra el mensaje de error real en pantalla (ya no catch silente).

---

## 2026-04-10 — Canjeo de puntos + Banners de puntos ganados

**Banners de puntos ganados:**
- `/checkout/webpay/success`: banner amber "¡Ganaste X puntos!" (solo usuarios registrados, puntos ya acreditados)
- `/checkout/reservation`: banner amber "Ganarás X puntos al retirar" (futuro, se acreditan al aprobar el admin)
- `calcPoints` se usa client-side desde `loyalty-utils` — no requiere llamada extra al API

**Canjeo de puntos de fidelización:**
- Tasa: 1 punto = $100 CLP de descuento (simétrico a ganancia: $1.000 gastados = 1 punto)
- Solo disponible en "Retiro en tienda" (Webpay tiene riesgo de reversión de pago)
- UI en checkout: toggle "Usar X puntos = $Y.000 de descuento" con total tachado + total efectivo
- Backend atómico: deducción de puntos + creación de orden en misma transacción Prisma
- `loyalty_transactions` registra puntos negativos con `reason='redemption'` y `order_id`
- Restauración automática: al cancelar orden (admin PUT) y al expirar reserva (cron cleanup)
- `loyalty.ts`: nuevas funciones `redeemLoyaltyPoints`, `restoreLoyaltyPoints`, `POINTS_TO_CLP`
- `loyalty-utils.ts`: exporta `POINTS_TO_CLP` para uso en Client Components

---

## 2026-04-10 — Lector de códigos de barra en POS + App Electron

**Lector de barras (USB HID) en POS:**
- Detección por timing: chars < 50ms entre sí + Enter = escáner (no teclado humano)
- Listener global `keydown` con `{ capture: true }` para interceptar antes que cualquier input
- `handleBarcodeScan(code)`: busca producto por `external_id` via `/api/products?barcode=X`, agrega al carrito
- Flash visual verde/rojo 2.5s con nombre del producto o mensaje de error
- Indicador "Lector de barras activo" en el header del POS
- API `/api/products`: nuevo filtro `?barcode=X` → `where.external_id = X`
- Nota: los barcodes se cargarán cuando el usuario entregue la BD con `external_id` por producto

**App Electron (mostrador farmacia):**
- Nuevo directorio `pharmacy-ecommerce/apps/desktop/`
- `main.js`: carga `https://tu-farmacia.cl` (live URL, sin servidor local)
- Flag `--pos`: abre `/admin/pos` directamente en 1280×800, oculta menú
- Flag `--kiosk`: modo pantalla completa kiosk
- Menú de app: POS (Ctrl+P), Admin (Ctrl+A), Recarga (Ctrl+R), Atrás (Alt+←), Pantalla completa (F11), Modo kiosk (Ctrl+Shift+K), Imprimir (Ctrl+Shift+P)
- Atajos globales: F5 recarga, Escape sale de kiosk
- Links externos se abren en el browser del sistema
- `preload.js`: expone solo `window.electronApp.platform` (aislamiento seguro)
- Build: `electron-builder --win --x64` → genera portable + instalador NSIS
- `package.json` scripts: `start`, `start:pos`, `build`, `build:portable`

---

## 2026-04-10 — Fidelización de puntos + Checkout mejorado para adultos mayores

**Feature A — Fidelización:**
- Schema: `loyalty_points Int` + `phone String?` en `profiles`, tabla `loyalty_transactions` (user_id, order_id, points, reason)
- Regla: 1 punto por cada $1000 CLP gastados (`Math.floor(total/1000)`)
- Se otorgan al confirmar pago Webpay (`/api/webpay/return`) y al aprobar retiro en tienda (`/api/admin/orders/[id]` → `approve_reservation`)
- API `GET /api/loyalty` → `{ points: number }` para el cliente
- `/mis-pedidos`: banner amber con estrella mostrando puntos acumulados
- Checkout: preview de puntos a ganar en el resumen del pedido

**Feature D — Checkout UX (adultos mayores):**
- Si el usuario está logueado: pre-llena nombre + email automáticamente
- Oculta campo contraseña (ya tiene sesión activa)
- Muestra "Hola, {nombre}" + aviso "Sesión activa — tus datos están pre-completados"
- `processStorePickup` salta el flujo de registro/login si hay sesión
- Email pre-llenado es `readOnly` para usuarios logueados

**Fix adicional:** `handleDuplicate` en admin/productos faltaba el campo `cost_price`.

---

## 2026-04-10 — MCP Plugins: GitHub + GoodMem reparados

**Problema:** `/mcp` reportaba `Failed to reconnect to plugin:goodmem:goodmem`. GitHub también fallaba silenciosamente.

**Causa raíz GoodMem:**
- El plugin `goodmem@claude-plugins-official` instala un servidor MCP en TypeScript (`mcp/src/index.ts`).
- El `.mcp.json` apunta a `${CLAUDE_PLUGIN_ROOT}/mcp/dist/index.js`, pero ese archivo **no existía** — el build nunca se había corrido.
- Fix: `cd ~/.claude/plugins/cache/.../goodmem/0.1.0/mcp && npm install && npm run build` → generó `dist/index.js` (788 KB bundle).

**Causa raíz GitHub:**
- El plugin `github@claude-plugins-official` usa MCP HTTP apuntando a `https://api.githubcopilot.com/mcp/` con `Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}`.
- La variable de entorno no estaba seteada.
- Fix: obtener token con `gh auth token` → `setx GITHUB_PERSONAL_ACCESS_TOKEN "gho_..."` (persistente en Windows).

**Acción requerida:** Reiniciar Claude Code para que ambos cambios tomen efecto.

**Nota:** Si GitHub MCP falla con error de auth, crear PAT clásico en `github.com/settings/tokens` con scopes `repo`, `read:org`, `copilot`.

---

## 2026-04-09 — Obsidian Mind Vault integrado como PKM del proyecto

**Vault instalado:** `C:\Users\Admin\Documents\obsidian-mind` (v3.7.0 — breferrari/obsidian-mind)

**Qué es:** Sistema de PKM (Personal Knowledge Management) integrado con Claude Code.
Sirve como cerebro externo del proyecto: decisiones, gotchas, patrones, fases ERP, arquitectura.

**Mapeo de contenido Tu Farmacia → Vault:**
- `brain/Gotchas.md` → gotchas conocidos del codebase (Webpay 26 chars, CLP sin decimales, Firebase Edge Runtime, etc.)
- `brain/Patterns.md` → patrones recurrentes del stack
- `brain/Key Decisions.md` → decisiones: migración Supabase→Firebase, Cloud SQL, Transbank prod
- `brain/North Star.md` → objetivos: ERP completo, POS, reportes financieros
- `reference/` → arquitectura: Auth flow, DB schema, API routes
- `work/active/` → fases ERP en progreso
- `work/archive/` → fases completadas

**Archivos actualizados:**
- `CLAUDE.md` → sección "Obsidian Mind Vault (PKM)" con mapeo, sistema de memoria y reglas
- `context.md` → sección 13 con paths del vault y comandos `/om-standup`, `/om-wrap-up`, `/om-dump`

**Comandos Claude disponibles desde el vault** (correr `claude` dentro de `obsidian-mind/`):
- `/om-standup` — kickoff de sesión
- `/om-wrap-up` — cierre: archiva, actualiza índices, captura learnings
- `/om-dump` — captura rápida de decisiones/ideas

---

## PLAN ERP — Fases Priorizadas (Abril 9, 2026)

> Diseñado en sesión de brainstorming. Ejecutar fase por fase en este orden.

### Fase 1 — Proveedores + Compras ← **SIGUIENTE**
### Fase 2 — Punto de Venta (POS)
### Fase 3 — Reportes Financieros (márgenes, costos, exportación)

---

## FASE 1: Módulo Proveedores + Compras

### Contexto del negocio
- Proveedores principales: **Mediven** y **Globalpharma** (portales web)
- Las cajas llegan con **facturas en papel** (también PDF por email, pero difícil acceso)
- **Flujo preferido**: sacar foto con cámara del celular a la factura → OCR automático → confirmar productos → stock sube
- Los códigos de producto del proveedor NO coinciden con `external_id` actual → hay que construir mapeo
- Se quiere guardar **precio de costo** para calcular márgenes reales (alimenta Fase 3)

### Tablas nuevas (migración Prisma)

```prisma
model suppliers {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name            String   @db.VarChar(255)
  rut             String?  @db.VarChar(20)
  contact_name    String?  @db.VarChar(255)
  contact_email   String?  @db.VarChar(255)
  contact_phone   String?  @db.VarChar(20)
  website         String?  @db.VarChar(255)
  notes           String?
  active          Boolean  @default(true)
  created_at      DateTime @default(now()) @db.Timestamptz(6)
  updated_at      DateTime @default(now()) @updatedAt @db.Timestamptz(6)
  purchase_orders purchase_orders[]
  supplier_product_mappings supplier_product_mappings[]
}

model purchase_orders {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  supplier_id     String   @db.Uuid
  invoice_number  String?  @db.VarChar(100)
  invoice_date    DateTime? @db.Date
  status          String   @default("draft") @db.VarChar(20)  // draft | received | cancelled
  total_cost      Decimal? @db.Decimal(10, 2)
  notes           String?
  image_url       String?  @db.VarChar(500)   // foto de la factura subida a Firebase Storage
  ocr_raw         String?  // JSON raw del resultado Vision API (para debug)
  created_by      String   @db.VarChar(255)
  created_at      DateTime @default(now()) @db.Timestamptz(6)
  updated_at      DateTime @default(now()) @updatedAt @db.Timestamptz(6)
  suppliers       suppliers @relation(fields: [supplier_id], references: [id])
  items           purchase_order_items[]
}

model purchase_order_items {
  id                   String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  purchase_order_id    String   @db.Uuid
  product_id           String?  @db.Uuid    // null si no mapeado aún
  supplier_product_code String? @db.VarChar(100)
  product_name_invoice String?  @db.VarChar(255)  // nombre tal como viene en la factura
  quantity             Int
  unit_cost            Decimal  @db.Decimal(10, 2)
  subtotal             Decimal  @db.Decimal(10, 2)
  purchase_orders      purchase_orders @relation(fields: [purchase_order_id], references: [id], onDelete: Cascade)
  products             products? @relation(fields: [product_id], references: [id], onDelete: SetNull)
}

model supplier_product_mappings {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  supplier_id     String   @db.Uuid
  supplier_code   String   @db.VarChar(100)
  product_id      String   @db.Uuid
  created_at      DateTime @default(now()) @db.Timestamptz(6)
  suppliers       suppliers @relation(fields: [supplier_id], references: [id], onDelete: Cascade)
  products        products  @relation(fields: [product_id], references: [id], onDelete: Cascade)
  @@unique([supplier_id, supplier_code])
}
```

**Campo a agregar en `products`:**
```prisma
cost_price  Decimal? @db.Decimal(10, 2)   // precio de costo más reciente
```

**Relaciones a agregar en `products`:**
```prisma
purchase_order_items     purchase_order_items[]
supplier_product_mappings supplier_product_mappings[]
```

### API Routes nuevas

```
GET  POST  /api/admin/suppliers              → CRUD proveedores
GET  PUT   DELETE /api/admin/suppliers/[id]  → detalle/editar/eliminar proveedor

GET  POST  /api/admin/purchase-orders        → lista / crear nueva OC
GET  PUT   /api/admin/purchase-orders/[id]   → detalle / actualizar estado
POST       /api/admin/purchase-orders/[id]/receive  → confirmar recepción: actualiza stock + cost_price

POST       /api/admin/purchase-orders/scan   → recibe imagen base64, llama Vision API, devuelve líneas extraídas
POST       /api/admin/purchase-orders/[id]/map-product  → guarda mapeo supplier_code → product_id
```

### Páginas nuevas

```
/admin/proveedores              → lista de proveedores con stats (# OC, último pedido)
/admin/proveedores/nuevo        → formulario crear proveedor
/admin/proveedores/[id]         → detalle proveedor + historial de compras

/admin/compras                  → lista de órdenes de compra (filtro: proveedor, estado, fecha)
/admin/compras/nueva            → crear OC:
                                   1. Seleccionar proveedor
                                   2. FOTO con cámara (capture="environment") o subir imagen
                                   3. OCR → tabla de líneas extraídas
                                   4. Mapear productos no reconocidos (buscar en catálogo)
                                   5. Confirmar → stock sube, cost_price actualiza
/admin/compras/[id]             → detalle OC + líneas + foto de factura
```

### Flujo OCR con cámara (detalle técnico)

1. `<input type="file" accept="image/*" capture="environment">` → abre cámara en móvil
2. Frontend convierte imagen a base64 → POST `/api/admin/purchase-orders/scan`
3. API llama `@google-cloud/vision` TextDetection (ya tienen `GOOGLE_CLOUD_VISION_API_KEY`)
4. API parsea el texto para extraer líneas: código, descripción, cantidad, precio unitario
5. Para cada línea: buscar en `supplier_product_mappings` → si hay match, asigna `product_id`; si no, queda pendiente de mapeo manual
6. Frontend muestra tabla: líneas auto-reconocidas (verde) + líneas a mapear (naranja, con búsqueda inline)
7. Al confirmar: `POST /api/admin/purchase-orders/[id]/receive`
   - Incrementa `stock` en cada producto
   - Actualiza `cost_price` en `products`
   - Registra movimiento en `stock_movements` (reason: 'purchase')
   - Guarda nuevos mappings para el futuro
   - Cambia status a 'received'

### Sidebar — nuevos items a agregar

En `src/components/admin/Sidebar.tsx`:
- "Proveedores" (icono: Truck) → `/admin/proveedores`
- "Compras" (icono: ShoppingCart o ClipboardList) → `/admin/compras` (con badge de OCs en draft)

### Componente existente a aprovechar

`src/components/admin/ScanInvoiceModal.tsx` — revisar si reusar o refactorizar como base para el flujo de cámara+OCR.

### Orden de implementación sugerido

1. Migración Prisma (nuevas tablas + `cost_price` en products)
2. API `/api/admin/suppliers` CRUD
3. Página `/admin/proveedores`
4. API `/api/admin/purchase-orders/scan` (Vision OCR)
5. API `/api/admin/purchase-orders` CRUD + receive endpoint
6. Página `/admin/compras/nueva` (flujo cámara → OCR → mapeo → confirmar)
7. Página `/admin/compras` (lista) + `/admin/compras/[id]` (detalle)
8. Actualizar sidebar

---

## SESIÓN Abril 9, 2026 — ERP Fase 1 completa ✅

### Completado
- **Migración Prisma** (`prisma db push`): tablas `suppliers`, `purchase_orders`, `purchase_order_items`, `supplier_product_mappings` + campo `cost_price` en `products`
  - Approach: `prisma db push` + IP temporalmente autorizada en Cloud SQL (no `migrate dev` — DB sin historial de migraciones)
- **API `/api/admin/suppliers`** CRUD completo (GET, POST, GET/:id, PUT/:id, DELETE/:id con validación de OCs)
- **API `/api/admin/purchase-orders`**: lista/crear, detalle/actualizar, `/receive` (transacción atómica: stock++, cost_price, stock_movements, mappings), `/map-product`, `/scan` (Vision API OCR)
- **Páginas admin**: `/admin/proveedores` (lista + modal), `/admin/compras` (lista filtrable), `/admin/compras/nueva` (flujo 4 pasos: proveedor → foto → OCR → confirmar), `/admin/compras/[id]` (detalle)
- **Sidebar**: items "Proveedores" (Truck) + "Compras" (ClipboardList) con badge azul para OCs en draft
- **lib/api.ts**: `supplierApi` + `purchaseOrderApi` con tipos TypeScript
- **Obsidian vault**: `brain/Gotchas.md`, `brain/North Star.md`, `work/active/ERP Fase 1.md` poblados
- **Build**: 45/45 páginas, 0 errores TypeScript

### Decisiones técnicas
- OCR usa Google Cloud Vision API REST (misma key que scan-invoice existente, no SDK)
- Parser de facturas heurístico multi-línea (distinto al `HeuristicParser` existente que parsea etiqueta single-product)
- `$transaction` de Prisma en `/receive` para atomicidad
- Firebase Storage para foto de factura: diferido a Fase 2 (image_url = null en draft)

### Pendientes (siguiente sesión)
- ~~Fase 2 — POS (Punto de Venta)~~ ✅ Completado

---

## SESIÓN Abril 9, 2026 — ERP Fase 2 completa ✅ — POS (Punto de Venta)

### Completado
- **API `POST /api/admin/pos/sale`**: crea orden `completed` + `payment_provider='pos_cash'|'pos_debit'|'pos_credit'` en `$transaction` atómica con decremento de stock y `stock_movements` reason=`sale_pos`
- **Página `/admin/pos`**: layout split (búsqueda izquierda, carrito derecho), búsqueda con debounce, grid de productos, control qty en carrito, selector de método de pago, modal de confirmación con calculadora de vuelto para efectivo, campos opcionales de cliente
- **Sidebar**: item "POS" (Receipt) en segunda posición tras Dashboard
- **lib/api.ts**: `posApi.sale()` exportado

### Decisiones técnicas
- No se requirió migración de esquema: se reutiliza tabla `orders` con nuevos valores de `payment_provider`
- Validación de stock antes de iniciar transacción (pre-check) + decremento atómico en `$transaction`
- La venta POS aparece automáticamente en `/admin/ordenes` con estado `completed`
- `reason: 'sale_pos'` en `stock_movements` distingue ventas POS de ventas online

### Pendientes
- ~~Fase 3 — Reportes Financieros~~ ✅ Completado

---

## SESIÓN Abril 9, 2026 — ERP Fase 3 completa ✅ — Reportes Financieros

### Completado
- **API `/api/admin/reportes`** extendida:
  - Incluye órdenes POS (`payment_provider IN ['pos_cash','pos_debit','pos_credit']`) junto a órdenes online
  - KPIs nuevos: `totalCost`, `grossMargin`, `marginPct`
  - `channelBreakdown`: online vs POS (con desglose efectivo/débito/crédito)
  - `salesByDay`: divide `ventas` (online) + `ventas_pos` por día
  - `topProducts`: agrega `cost`, `margin`, `margin_pct` (cuando product tiene `cost_price`)
  - `topByMargin`: top 10 por margen bruto (filtrado a productos con costo)
  - `byCategory`: agrega `cost` y `margin` por categoría
- **Página `/admin/reportes`** renovada:
  - Tabs "Ventas" y "Financiero"
  - 6 KPI cards: Revenue, Órdenes, Ticket promedio, Costo total, Margen bruto, % Margen
  - Canal breakdown (Online vs POS con desglose de método de pago)
  - Gráfico líneas: ventas por día separado por canal
  - Tab Financiero: bar chart top 10 por margen, bar chart Revenue vs Costo por categoría, tabla financiera completa
  - CSV export con columnas Costo, Margen, % Margen

### Decisiones técnicas
- Margen solo calculable cuando products.cost_price ≠ NULL (se actualiza al recibir OCs en Fase 1)
- `margin_pct >= 20%` = verde, `>= 0%` = ámbar, `< 0%` = rojo
- Warning banner si totalCost === 0 (no hay productos con costo ingresado aún)

### Estado ERP
- Fase 1 Proveedores + Compras ✅
- Fase 2 POS ✅
- Fase 3 Reportes Financieros ✅
- Mejoras post-Fase 3 ✅

### Mejoras post-Fase 3 (misma sesión)
- **compras/[id]**: botón "Recibir OC" (llama `/receive` API) + banner verde cuando recibida. Antes no había UI para recibir OC.
- **GET /api/admin/stock-movements**: lista paginada con filtros por `reason`
- **POST /api/admin/stock-movements/adjust**: ajuste manual atómico ($transaction) con validación de stock no negativo
- **Página `/admin/stock`**: tabla de movimientos con delta coloreado, filtros, paginación + modal "Ajustar stock" con búsqueda de producto
- **Sidebar**: item "Stock" (ArrowUpDown)
- **Órdenes**: stat card "Ventas POS", filtro chip POS (matches pos_cash|debit|credit), CSV labels POS. API: parámetro `channel=pos|online`
- **Reportes API**: ahora incluye órdenes POS automáticamente (revenue POS visible en dashboard)

---

## SESIÓN Abril 9, 2026 — Imágenes rotas arregladas

### Completado
- **Script `fix_broken_images.mjs`**: detecta y arregla URLs de imagen rotas en Cloud SQL
  - Fase 1: chequeo paralelo de URLs (20 concurrentes) — detectó 149 URLs rotas de 1462
  - Fase 2: búsqueda de reemplazo via DuckDuckGo + update en Cloud SQL
  - Resultado: **147/149 arregladas, 0 sin reemplazo, 0 errores DB** (8.5 min)
  - Los primeros 2 fueron arreglados en tandas anteriores del mismo script
- **Nota técnica**: script actualiza Cloud SQL (Prisma/producción), no Supabase (obsoleto)

### Sin tareas pendientes

---

## SESIÓN Abril 9, 2026 — Limpieza post-migración

### Completado
- **Vars Supabase eliminadas de Vercel**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — ya no quedan referencias a Supabase en producción
- **Migración usuarios**: 3 usuarios migrados de Supabase Auth → Firebase Auth con mismos UIDs (Adan Ardiles, Gloria Cortes, admin@pharmacy.com). Script: `pharmacy-ecommerce/scripts/run-migration.mjs`
- **Reset-password branded**: `sendPasswordResetEmail` con `handleCodeInApp: true` → link del email apunta directamente a `https://tu-farmacia.cl/auth/reset-password?oobCode=...` (ya no pasa por página genérica de Firebase)
- **Cron cada 30 min**: `vercel.json` actualizado de `0 3 * * *` a `*/30 * * * *` (Vercel Pro confirmado)

### Sin tareas pendientes
El stack está 100% limpio y en producción.

---

## SESIÓN Abril 8, 2026 (tarde) — Migración completa

### Completado
- **Service account GCP**: `tu-farmacia-prod-1d6e516dbae2.json` creado, protegido en `.gitignore`
- **Credenciales en Vercel** (production + development): `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `GOOGLE_CLOUD_VISION_API_KEY`, `GOOGLE_SERVICE_ACCOUNT`, `CLOUD_SQL_INSTANCE`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- **Cloud SQL**: instancia `tu-farmacia-db` (PostgreSQL 15, southamerica-east1), usuario `farmacia`, DB `farmacia`
- **Datos migrados**: 1482 productos, 17 categorías, 48 órdenes, 174 mapeos terapéuticos
- **Firebase Auth Email/Password**: habilitado via Identity Platform API
- **Supabase eliminado**: `@supabase/ssr`, `@supabase/supabase-js` removidos; `src/lib/supabase/` eliminado
- **Prisma 7**: schema actualizado con `driverAdapters` preview; `prisma generate` OK
- **Build**: ✅ 43/43 páginas, 0 errores TypeScript
- **Deploy**: `git push origin main` → Vercel auto-deploy lanzado
- **context.md**: creado en `pharmacy-ecommerce/context.md` con todas las credenciales y tareas

### Pendiente
1. **Migrar usuarios** (opcional): exportar CSV desde Supabase Auth → ejecutar `scripts/migrate-users.ts`
2. **Setear admin**: `npx ts-node scripts/migrate-users.ts --set-admin timadapa@gmail.com`
3. **Remover vars Supabase en Vercel** (después de validar): `vercel env rm NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
4. **Validar en producción**: registrar usuario → login → checkout → admin panel

### Credenciales Cloud SQL (también en context.md)
- Instance: `tu-farmacia-prod:southamerica-east1:tu-farmacia-db`
- IP pública: `34.39.232.207` (sin authorized networks — usa Cloud SQL connector IAM)
- DB: `farmacia` / User: `farmacia` / Password: `srcmlaYhkEo19YivrG4FDLH0woou`

---

## Estado anterior: EN MIGRACIÓN — Supabase → Firebase Auth + Cloud SQL (Abril 2026)

---

## SESIÓN Abril 8, 2026 — Build OK + bugs corregidos

### Resultado
- `next build` pasa: 43/43 páginas, 0 errores TypeScript

### Bug crítico encontrado y corregido
**Edge Runtime + firebase-admin:** `firebase-admin` no puede correr en Next.js middleware (Edge Runtime).
- **Síntoma:** Build falla / error en runtime al usar `adminAuth.verifySessionCookie()` en `src/middleware.ts`
- **Fix:** Reescrito el middleware para decodificar el JWT del session cookie sin usar firebase-admin SDK (decode sin verificar firma para routing decisions). La verificación segura ocurre en las API routes (Node.js runtime).
- **Regla para el futuro:** Todo código que use `firebase-admin` debe estar en API routes o Server Components con `export const runtime = 'nodejs'`, NUNCA en `middleware.ts`.

---

## EN PROGRESO: Migración Supabase → Firebase Auth + Cloud SQL PostgreSQL (Abril 7-8, 2026)

### Resumen
Migración completa del stack de datos de Supabase (Auth + PostgreSQL + RLS) a Google Cloud (Firebase Auth + Cloud SQL PostgreSQL 16) manteniendo Vercel como hosting.

### Código completado (esperando Cloud SQL billing fix):
- `src/lib/firebase/client.ts` — Firebase browser client singleton
- `src/lib/firebase/admin.ts` — Firebase Admin SDK (Auth)
- `src/lib/firebase/api-helpers.ts` — `getAuthenticatedUser`, `getAdminUser`, `errorResponse` (reemplaza lib/supabase/api-helpers.ts)
- `src/lib/firebase/middleware.ts` — Session cookie verification para /admin y /mis-pedidos
- `src/lib/db.ts` — Prisma client singleton con Cloud SQL connector
- `src/middleware.ts` — Actualizado a Firebase middleware
- `src/app/api/auth/session/route.ts` — POST/DELETE para crear/destruir session cookie Firebase
- `src/app/api/auth/register/route.ts` — Firebase Admin createUser
- `src/store/auth.ts` — Reescrito con Firebase Auth SDK
- `src/app/auth/forgot-password/page.tsx` — Firebase sendPasswordResetEmail
- `src/app/auth/reset-password/page.tsx` — Firebase confirmPasswordReset
- `src/lib/api.ts` — Todas las llamadas Supabase → fetch a API routes
- `src/app/api/products/route.ts` — Nueva, Prisma (reemplaza PostgREST)
- `src/app/api/products/[slug]/route.ts` — Nueva, Prisma
- `src/app/api/products/id/route.ts` — Nueva, Prisma
- `src/app/api/products/batch/route.ts` — Nueva, Prisma
- `src/app/api/products/filters/route.ts` — Nueva, Prisma
- `src/app/api/categories/route.ts` — Nueva, Prisma
- `src/app/api/categories/[id]/route.ts` — Nueva, Prisma
- `src/app/api/orders/route.ts` — Nueva, Firebase auth + Prisma
- `src/app/api/orders/[id]/route.ts` — Nueva, Firebase auth + Prisma
- `src/app/api/webpay/create/route.ts` — Reescrito con Prisma
- `src/app/api/webpay/return/route.ts` — Reescrito con Prisma ($transaction atomic)
- `src/app/api/store-pickup/route.ts` — Reescrito con Prisma
- `src/app/api/admin/orders/route.ts` — Reescrito con Prisma
- `src/app/api/admin/orders/[id]/route.ts` — Reescrito con Prisma (approve/reject/stock restore)
- `src/app/api/admin/products/route.ts` — Reescrito con Prisma
- `src/app/api/admin/products/[id]/route.ts` — Reescrito con Prisma
- `src/app/api/admin/products/[id]/stock/route.ts` — Reescrito con Prisma
- `src/app/api/admin/products/import/route.ts` — Reescrito con Prisma
- `src/app/api/admin/categories/route.ts` — Reescrito con Prisma
- `src/app/api/admin/categories/[id]/route.ts` — Reescrito con Prisma
- `src/app/api/admin/settings/route.ts` — Reescrito con Prisma
- `src/app/api/admin/reportes/route.ts` — Reescrito con Prisma
- `src/app/api/admin/scan-invoice/route.ts` — POST: Google Cloud Vision OCR + Firebase Storage audit trail + parser heurístico
- `src/lib/invoice-parser/types.ts` — Interfaces `ScannedProductData` + `InvoiceParser`
- `src/lib/invoice-parser/heuristic-parser.ts` — Parser regex para facturas CL (precio CLP, labs, receta, presentación)
- `src/lib/invoice-parser/registry.ts` — `getParser()` pluggable para múltiples formatos de factura
- `src/components/admin/ScanInvoiceModal.tsx` — Modal con capture/processing/review/error (camera + file upload)
- `src/app/api/admin/scan-invoice/route.ts` — Import actualizado a Firebase api-helpers
- `src/app/api/admin/clientes/route.ts` — Reescrito con Firebase Admin listUsers + Prisma
- `src/app/api/admin/clientes/[id]/route.ts` — Reescrito con Firebase Admin SDK
- `src/app/api/cron/cleanup-orders/route.ts` — Reescrito con Prisma updateMany
- `src/app/page.tsx` — loadDiscountedProducts usa fetch a /api/products
- `src/app/checkout/page.tsx` — Fallback sign-in usa Firebase
- `src/app/sitemap.ts` — Usa getDb() + Prisma directamente
- `src/lib/excel-import.ts` — loadAllProductsForDiff usa fetch paginado a /api/products
- `scripts/migrate-users.ts` — One-time script para migrar usuarios Supabase CSV → Firebase
- `database/cloud-sql-extra-tables.sql` — SQL para tablas extra (admin_settings, stock_movements, discount_percent)

### Build status: ✅ `next build` pasa — 43/43 páginas, 0 errores TypeScript
Bugs corregidos durante build:
- `firebase/middleware.ts`: firebase-admin no corre en Edge Runtime. Reescrito con decodificación JWT sin verificar firma (solo UX redirects; seguridad real en API routes con firebase-admin).
- `firebase/admin.ts`: `adminAuth` inicializaba en module load → crash build. Convertido a Proxy lazy.
- `firebase/client.ts`: Firebase client SDK hacía llamadas HTTP durante SSR prerender → `auth/invalid-api-key`. Fix: solo inicializar en browser (`typeof window !== 'undefined'`).
- `db.ts`: string literals `'PUBLIC'`/`'PASSWORD'` no compatibles con tipos del connector. Fix: `IpAddressTypes.PUBLIC` / `AuthTypes.PASSWORD`.
- `admin/settings`: `updated_at` no existe en `admin_settings`. Removido.
- `admin/products/[id]/stock`: `errorResponse` faltaba segundo argumento status. Agregado 400.

### Firebase configurado ✅ (Abril 8, 2026)
- Web app creada en Firebase: `1:164275006028:web:0bcb105734e84a2f7be2e9`
- Variables en Vercel (production + development): `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`
- `.env.local` actualizado con valores Firebase para desarrollo local
- **Pendiente Firebase**: habilitar Email/Password en Firebase Console → Authentication → Sign-in method
- **Pendiente**: crear service account GCP → agregar `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` a Vercel
- **Pendiente**: habilitar Vision API + crear API key → agregar `GOOGLE_CLOUD_VISION_API_KEY` a Vercel

### BLOQUEADOR: Cloud SQL billing
- Proyecto GCP `tu-farmacia-prod` tiene problema de billing en `timadapa@gmail.com`
- Ir a console.cloud.google.com/billing → vincular cuenta de facturación válida
- Luego: crear instancia Cloud SQL + migrar datos + generar prisma/schema.prisma

### Pendiente después de billing fix:
1. Crear Cloud SQL instance + DB + usuario
2. pg_dump desde Supabase → importar a Cloud SQL (+ ejecutar cloud-sql-extra-tables.sql)
3. Service account con roles/cloudsql.client
4. Cloud SQL Auth Proxy local → `prisma db pull` → `prisma generate`
5. Habilitar Firebase Auth Email/Password en console.firebase.google.com
6. Configurar variables de entorno en Vercel (agregar Firebase+CloudSQL, remover Supabase)
7. Ejecutar scripts/migrate-users.ts con CSV export de Supabase
8. Setear custom claim admin: `npx ts-node scripts/migrate-users.ts --set-admin email@x.com`
9. Remover paquetes npm: `@supabase/ssr @supabase/supabase-js`
10. Eliminar src/lib/supabase/ (4 archivos)
11. Build + deploy

---

## COMPLETADO: Fix dark mode admin - badges, modales, tablas, globales (Abril 6, 2026)

### Resumen
- **Dark mode badges de estado (dashboard)**: Los `textColor` de los stat cards en `admin/page.tsx` no tenían `dark:` variants. Fix: `dark:text-{color}-400` en todos los 6 stat cards.
- **Dark mode status badges (dashboard)**: `statusBadgeColors` en `admin/page.tsx` sin variantes dark. Fix: `dark:bg-{color}-900/30 dark:text-{color}-300` en los 7 estados.
- **Dark mode bulk actions bar (productos)**: Barra de selección masiva sin dark variants. Fix: `dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-300`.
- **Dark mode import modal (productos)**: Todos los elementos del modal de importación Excel sin dark variants — summary cards, tabla preview (headers, rows, text), warning boxes, results section. Fix: dark variants completas en cada elemento.
- **Dark mode product table (productos)**: Mobile cards (badges activo/inactivo, stock, precio), pagination buttons (borders, text, hover), empty state (icon). Fix: `dark:` variants en todos.
- **Dark mode product form (productos)**: Label "Producto activo" sin dark variant, precio final sin dark variant. Fix: `dark:text-slate-300` / `dark:text-emerald-400`.
- **Dark mode categorias badges**: Badge "Activo" sin dark variant. Fix: `dark:bg-green-900/30 dark:text-green-300`.
- **Dark mode clientes badges**: Type badges (Registrado/Invitado) sin dark variants, avatar backgrounds/icons sin dark variants, order count sin dark variant. Fix: `dark:bg-{color}-900/30 dark:text-{color}-300` en todos.
- **Dark mode globals.css**: Agregadas overrides CSS para badges de colores en dark mode (green, yellow, amber, blue, red, orange, purple, pink) — backgrounds, text colors, borders, hover states. También overrides para slate text colors más precisos en dark mode.

### Archivos modificados
- `src/app/admin/page.tsx` — stat card textColors, statusBadgeColors con dark variants
- `src/app/admin/productos/page.tsx` — bulk actions bar, import modal, product table, pagination, form labels
- `src/app/admin/categorias/page.tsx` — active badge dark variant
- `src/app/admin/clientes/page.tsx` — type badges, avatars, order count dark variants
- `src/app/globals.css` — overrides CSS para colored badges, borders, backgrounds en dark mode

---

## COMPLETADO: Dark mode status badges + dark mode toggle en admin (Abril 4, 2026)

### Resumen
- **Dark mode STATUS_CONFIG / statusOptions**: Las listas de colores de estado en `admin/ordenes/page.tsx` y `admin/ordenes/[id]/page.tsx` no tenían variantes `dark:`. Como se usan concatenadas en `className`, los badges de estado aparecían con fondo claro intenso en dark mode. Fix: dark variants agregadas a todas las entradas (7 estados × 2 archivos).
- **Dark mode botones aprobar/rechazar (ordenes)**: Los botones inline "Aprobar" / "Rechazar" en la lista de órdenes (mobile + desktop) usaban `bg-emerald-100 text-emerald-800` y `bg-red-100 text-red-800` sin variantes dark. Fix: `dark:bg-emerald-900/30 dark:text-emerald-300` y equivalente en rojo.
- **Dark mode toggle en panel admin**: El header del admin no tenía toggle de tema claro/oscuro. Los admins debían volver a la Navbar pública para cambiarlo. Fix: botón Sol/Luna en el header del admin (junto a la notificación bell), usando el mismo `useTheme` hook que la Navbar pública.

### Archivos modificados
- `src/app/admin/ordenes/page.tsx` — STATUS_CONFIG con dark: variants, botones aprobar/rechazar con dark: variants
- `src/app/admin/ordenes/[id]/page.tsx` — statusOptions con dark: variants, email link en sección amber
- `src/app/admin/layout.tsx` — dark mode toggle (Sun/Moon) en header del admin
- `src/app/not-found.tsx` — dark mode (ícono, título, descripción)
- `src/app/error.tsx` — dark mode (ícono, título, descripción)
- `src/app/admin/error.tsx` — dark mode (ícono, título, descripción)
- `src/app/admin/loading.tsx` — dark mode en texto "Cargando panel..."
- `src/hooks/useAdminShortcuts.ts` — fix bug: shortcut `?` nunca disparaba porque `e.key === '?'` requiere Shift presionado, pero la condición tenía `!e.shiftKey` que lo bloqueaba siempre. Fix: eliminar el chequeo `!e.shiftKey`

---

## COMPLETADO: URL params + charts dark mode + bugfixes admin (Abril 4, 2026)

### Resumen
- **Bug fix: URL params no se leían en admin/productos**: La página inicializaba `stockFilter=''` y `searchTerm=''` con `useState('')` sin importar la URL. Links desde NotificationBell (`?stock=out`, `?stock=low`), dashboard (`?stock=low`, `?search=productname`), y shortcut ⌘N (`?action=new`) eran ignorados. Fix: `useSearchParams` con lazy `useState` initializer — 0 re-renders extra, se aplica en mount.
- **Charts dark mode (Recharts)**: Grid y axis de charts en `admin/page.tsx` y `admin/reportes/page.tsx` usaban `stroke="#374151"` / `"#E2E8F0"` hardcodeados. Recharts usa SVG props, no puede usar Tailwind `dark:`. Fix: `MutationObserver` en `document.documentElement` que detecta cambio de clase `dark` y actualiza `isDark` state. Grid usa `#334155` (dark) / `#E2E8F0` (light), axis usa `#64748B` / `#94A3B8`.

### Archivos modificados
- `src/app/admin/productos/page.tsx` — lee `?stock`, `?search`, `?action=new` desde URL en mount
- `src/app/admin/page.tsx` — isDark state con MutationObserver para chart colors
- `src/app/admin/reportes/page.tsx` — isDark state con MutationObserver para chart colors

---

## COMPLETADO: Fix notificaciones + dark mode total admin (Abril 4, 2026)

### Resumen
- **Fix crítico NotificationBell**: Dos bugs raíz corregidos: (1) cada poll sobreescribía `read: false` borrando el estado leído; (2) `clearAll` vaciaba el array pero el siguiente poll lo repoblaba completo. Fix: `dismissedIds` como `useRef<Set<string>>` — IDs descartadas persisten entre re-renders. Merge ahora preserva `read` state con `existingReadState` map. Agregado botón ✕ por notificación (hover).
- **Dark mode admin/clientes**: Dark mode completo — tabla (header, rows, hover, selected), mobile cards, footer, side panel (container, header, botones), info de cliente, edit form labels/buttons, order stats, order history cards, items, badges.
- **Dark mode admin/categorias**: Skeletons, badge "Inactivo", warning box de eliminación, hover buttons.
- **Dark mode admin/reportes**: Loading skeleton, KPI icon backgrounds (dark tints), chart title faltante.
- **Dark mode admin/productos (completo)**: Todos los inputs/selects del filter bar (search, categoría, stock, sort), filter toggle button, stats pill, active filter chips (todos los colores), advanced filters panel (labels, lab search, lab list, prescription buttons, price inputs, quick filters, summary box, clear button).

### Archivos modificados
- `src/components/admin/NotificationBell.tsx` — fix dismiss persistente + preservar read state + botón ✕ por item
- `src/app/admin/clientes/page.tsx` — dark mode completo
- `src/app/admin/categorias/page.tsx` — dark mode completo
- `src/app/admin/reportes/page.tsx` — dark mode completado
- `src/app/admin/productos/page.tsx` — dark mode completado (filter bar + advanced filters)

---

## COMPLETADO: Dark mode completo en todas las páginas admin (Abril 3, 2026 - continuación)

### Resumen
- **Dark mode StockModal**: Historia de movimientos (sticky header, dividers, badges de delta +/-).
- **Dark mode admin/ordenes/[id]**: Timeline, loading skeleton, cards de acción (reserva, webpay), sección de productos, cliente, resumen, acciones rápidas.
- **Dark mode admin/ordenes/page**: Header, stat cards, filtros, tabla desktop (thead, tbody, rows), mobile cards, paginación, empty state.
- **Dark mode admin/configuracion**: Labels, placeholders, divisor, mensaje de guardado.
- **Dark mode admin/page (dashboard)**: Header, skeletons, text de stat cards, chart headers, listas de stock crítico y órdenes recientes.
- **Dark mode admin/productos**: Header, form modal bg, import modal bg, labels del form, tabla (thead, tbody, rows hover/selected, stock badges), loading skeleton.

### Archivos modificados
- `src/components/admin/StockModal.tsx` — historial de movimientos con dark mode
- `src/app/admin/ordenes/[id]/page.tsx` — dark mode completo
- `src/app/admin/ordenes/page.tsx` — dark mode completo
- `src/app/admin/configuracion/page.tsx` — dark mode completo
- `src/app/admin/page.tsx` — dark mode en dashboard
- `src/app/admin/productos/page.tsx` — dark mode parcial (header, modals, tabla)

---

## COMPLETADO: Bugfixes, dark mode admin, categorías inactivas (Abril 3, 2026)

### Resumen
- **res.ok en reportes**: `loadData` en reportes ahora verifica `res.ok` antes de `setData`. Sin esto, un 401/403 ponía `{ error: '...' }` en `data` y crasheaba el render en `data.kpis.totalRevenue`.
- **Crash en clientes**: Panel de detalle de cliente hacía `data.customer.name` sin verificar `res.ok`. Si la API fallaba (e.g. 404), crasheaba. Corregido con early return.
- **Register redirect**: Página de registro ignoraba `?redirect=` del query. Al registrarse desde checkout, el usuario volvía al home perdiendo el carrito. Corregido con Suspense + `useSearchParams`, igual que login page. También preserva el redirect en el link "Inicia sesión".
- **Cart botón + sin deshabilitar**: El botón de incrementar cantidad en carrito no tenía `disabled` cuando `quantity >= stock`. El usuario podía hacer click indefinidamente (cartStore lo capaba en fetchCart, pero sin feedback visual). Corregido: `disabled={item.quantity >= item.stock}`.
- **Categorías inactivas invisibles (bug crítico)**: `productApi.listCategories()` filtraba `active = true`. Si el admin desactivaba una categoría, desaparecía del panel de admin sin poder reactivarla. Corregido: `listCategories` acepta `activeOnly` param (default: `true` para público, `false` para admin). Admin categorías y dashboard usan `false`.
- **Dark mode NotificationBell dropdown**: Fondo, bordes, textos y highlight de no-leído actualizados.
- **Dark mode CommandPalette**: Dialog, input, resultados, footer con teclas de acceso, búsquedas recientes.
- **Dark mode admin/reportes**: Header, botones de período, KPI cards, headers de charts, tabla de productos, empty states.

### Archivos modificados
- `src/lib/api.ts` — listCategories acepta activeOnly param
- `src/app/admin/categorias/page.tsx` — usa listCategories(false) + dark mode completo
- `src/app/admin/page.tsx` — usa listCategories(false) para conteo correcto
- `src/app/admin/reportes/page.tsx` — res.ok check + dark mode completo
- `src/app/admin/clientes/page.tsx` — res.ok check antes de acceder a data.customer
- `src/app/auth/register/page.tsx` — Suspense + useSearchParams + redirect chain
- `src/app/carrito/page.tsx` — botón + disabled cuando quantity >= stock
- `src/components/admin/NotificationBell.tsx` — dark mode dropdown
- `src/components/admin/CommandPalette.tsx` — dark mode dialog completo

---

## COMPLETADO: Dark mode elegante + responsividad móvil (Abril 3, 2026)

### Resumen
- **Dark mode elegante**: Reemplazada paleta `slate-*` (azul-grisáceo `#0f172a`) por warm-neutral dark (`#13131a`, `#1e1e27`, `#2a2a35`). Un único bloque CSS en `globals.css` post-utilities override afecta todas las páginas sin tocar archivos individuales. Referencia visual: GitHub Dark, Linear, Vercel dark UI.
- **Responsividad móvil 320-375px**: 6 bugs críticos corregidos:
  - `overflow-x: hidden` en `html` y `body` — elimina scroll horizontal global
  - Navbar logo: `text-sm sm:text-lg`, SVG `w-7 sm:w-[34px]`, gap reducido en xs
  - Cart button navbar: `px-3 sm:px-4`, `min-h-48px` en xs
  - Categorías home: `text-sm sm:text-base` en grid 2 columnas
  - Mis-pedidos lista: badge de estado `flex-col` en móvil con `whitespace-nowrap`
  - Mis-pedidos detalle: `min-w-0 flex-1` en nombres, pickup code `text-3xl sm:text-4xl`
  - Reserva: pickup code `text-3xl sm:text-5xl` (era `text-5xl` fijo — desbordaba)
- **Dark mode auth**: `auth/login` y `auth/register` — todos los elementos con `dark:` variants (register estaba completamente sin dark mode)
- **Mis-pedidos detail statusConfig**: todos los badges de estado con `dark:bg-*/30 dark:text-*-300`
- **context.md creado**: Documentación completa de herramientas, CLIs, plugins y estado del proyecto para retomar desde otro PC

### Archivos modificados
- `src/app/globals.css` — paleta dark mode elegant + overflow-x:hidden + overrides de slate-*
- `src/components/Navbar.tsx` — logo compacto xs, cart button xs, gap reducido
- `src/app/page.tsx` — categorías text-sm xs
- `src/app/mis-pedidos/page.tsx` — badge estado layout móvil
- `src/app/mis-pedidos/[id]/page.tsx` — statusConfig dark:, product min-w-0, pickup code size, header badge
- `src/app/checkout/reservation/page.tsx` — pickup code size
- `src/app/auth/login/page.tsx` — dark mode completo
- `src/app/auth/register/page.tsx` — dark mode completo
- `context.md` (raíz repo) — nuevo archivo de contexto

---

## COMPLETADO: Dark mode + recetas WhatsApp + horario (Abril 2, 2026)

### Resumen
- **Dark mode completo**: Todas las páginas (homepage, producto, carrito, checkout, mis-pedidos, auth, resultados Webpay) ahora tienen soporte completo dark mode con `dark:` variants de Tailwind.
- **Toggle dark mode en Navbar**: Botón Sol/Luna en la barra superior. Persiste preferencia en localStorage (`theme`). Anti-flash script en `<head>` evita parpadeo al cargar.
- **Checkout WhatsApp (Webpay)**: Al seleccionar pago Webpay y confirmar, aparece modal para contactar por WhatsApp antes de proceder al pago, evitando problemas de stock.
- **Productos con receta → solo WhatsApp**: Productos `prescription_type === 'retained'` (Receta Retenida) o `prescription_type === 'prescription'` (Receta Médica) ya no muestran botón "Agregar al carrito". En su lugar muestran aviso amarillo explicativo + botón verde "Consultar por WhatsApp" con mensaje pre-llenado del producto.
- **Horario de atención actualizado**: Footer ahora muestra "Lunes a Domingo: 9:00 - 20:00" (antes era L-V 9-19 + Sáb 10-14).

### Archivos modificados
- `src/app/layout.tsx` — horario footer, dark mode footer, anti-flash script
- `src/app/page.tsx` — dark mode homepage
- `src/app/producto/[slug]/page.tsx` — dark mode + lógica WhatsApp para recetas
- `src/app/carrito/page.tsx` — dark mode
- `src/app/checkout/page.tsx` — dark mode + modal WhatsApp pre-Webpay
- `src/app/checkout/webpay/success/page.tsx` — dark mode
- `src/app/mis-pedidos/page.tsx` — dark mode
- `src/app/mis-pedidos/[id]/page.tsx` — dark mode
- `src/components/Navbar.tsx` — toggle Sol/Luna
- `src/hooks/useTheme.ts` — localStorage key `theme` (app-wide)
- `tailwind.config.js` — `darkMode: 'class'`

---

## COMPLETADO: Correcciones UX y calidad de código (Marzo 27, 2026 — sesión 5)

### Resumen
- **isPickup consistente en admin detalle de orden**: `admin/ordenes/[id]/page.tsx` usaba `!!order.pickup_code` para detectar retiro, mientras el resto del código usa `payment_provider === 'store'`. Unificado a `payment_provider === 'store'`.
- **Feedback de guardado en Configuración**: `handleSave` en admin/configuracion mostraba "Guardado" incluso si el PATCH devolvía un HTTP error. Corregido: ahora solo muestra éxito si `res.ok`.
- **Redirect chain en registro**: Si un usuario llegaba a login con `?redirect=/mis-pedidos` y luego hacía clic en "Regístrate", perdía el contexto y al registrarse volvía al home. Corregido: login page pasa el `?redirect=` al link de registro, y la página de registro ahora acepta y usa ese parámetro con Suspense boundary.
- **Cart stock cap**: La página de carrito no limitaba la cantidad al stock disponible. Un usuario podía agregar más unidades de las disponibles y solo descubrirlo al hacer checkout. Corregido: `CartItem` ahora incluye `stock`, `fetchCart` lo popula desde los datos del producto y automáticamente ajusta cantidades que excedan el stock (también sincroniza localStorage). El botón "+" en el carrito se deshabilita al alcanzar el stock. Se muestra indicador visual "Quedan N" o "Máximo disponible" cuando stock ≤ 10.

---

## COMPLETADO: Correcciones checkout y UX (Marzo 27, 2026 — sesión 4)

### Resumen
- **Bug crítico: botón checkout deshabilitado para usuarios autenticados**: La condición `disabled` del botón incluía `!password || !confirmPassword`, pero para usuarios con sesión activa esos campos no se renderizan y su estado permanece como `''`. Resultado: usuarios logueados nunca podían completar una compra. Corregido: condición cambiada a `(!user && (!password || !confirmPassword))`.
- **Email no trimmeado en payload de checkout**: `email` no se le aplicaba `.trim()` en el payload enviado a `/api/webpay/create` y `/api/store-pickup`, a diferencia de `name`, `surname`, `phone`. Corregido.
- **Race condition en webpay/return**: El flujo SELECT + UPDATE no era atómico. Dos callbacks concurrentes de Transbank podían ambos encontrar la orden en estado `pending` y deducir el stock dos veces. Corregido: el UPDATE ahora incluye `.eq('status', 'pending')` (compare-and-swap). Si el UPDATE no afecta filas, el request es idempotente y redirige a éxito.
- **Login redirect post-checkout**: Al hacer clic en "Inicia sesión" desde `/checkout`, el usuario era redirigido al home después del login, perdiendo el carrito/formulario. Corregido: login page acepta `?redirect=` query param. Links en checkout apuntan a `/auth/login?redirect=/checkout`. También corregido en `/mis-pedidos` → `/auth/login?redirect=/mis-pedidos`.

---

## COMPLETADO: Correcciones y mejoras (Marzo 27, 2026 — sesión 3)

### Resumen
- **Bug crítico: user_id en órdenes**: `/api/webpay/create` y `/api/store-pickup` siempre creaban órdenes con `user_id: null`. Los usuarios autenticados no veían sus órdenes en `/mis-pedidos`. Corregido: ambas rutas ahora llaman `getAuthenticatedUser()` y asignan `user_id` si hay sesión activa.
- **NotificationBell loop infinito**: `lastCheck` estaba en deps de `useEffect`, causando que `setLastCheck(new Date())` al final de `checkNotifications` re-disparara el efecto inmediatamente (bucle cerrado sin pausa de 30s). Corregido: eliminado `lastCheck`, `checkNotifications` envuelto en `useCallback([user])`.
- **Admin dashboard revenue**: Ingresos calculados con el endpoint `/api/admin/reportes` (server-side, sin límite de 1000 órdenes). La llamada se inicia en paralelo antes del `Promise.all` para no bloquear carga.
- **Admin dashboard "Por atender"**: Ahora incluye `pending + reserved` (retiros de tienda también necesitan atención).
- **Páginas de recuperación de contraseña**: Nuevas páginas `/auth/forgot-password` y `/auth/reset-password` con flujo completo de Supabase `resetPasswordForEmail` + `onAuthStateChange('PASSWORD_RECOVERY')`.
- **Show/hide contraseña**: Toggle Eye/EyeOff agregado a campos de contraseña en `/auth/login` y `/auth/register`.
- **Cron + emails reservas expiradas**: `cleanup-orders` ahora consulta emails antes del UPDATE y llama `sendPickupRejectionEmail` (no-blocking) para cada reserva cancelada por expiración.

---

## COMPLETADO: Correcciones y mejoras adicionales (Marzo 27, 2026 — sesión 2)

### Resumen
- **Admin sidebar badge fix**: `layout.tsx` usaba `orderApi.list()` (filtraba por user_id). Cambiado a `orderApi.listAll()` — ahora muestra el conteo real de órdenes pendientes de clientes.
- **Admin CommandPalette fix**: Búsqueda de órdenes usaba `orderApi.list({ limit: 5 })`. Cambiado a `orderApi.listAll({ limit: 20 })` — ahora encuentra órdenes de cualquier cliente.
- **Admin clientes — bug fix**: `STATUS_LABELS` no incluía el estado `'paid'`. Órdenes Webpay en estado "Pagado" no mostraban badge. Agregado.
- **Revenue bug fix**: Cálculo de ingresos en dashboard incluía órdenes `reserved` (retiros sin pagar). Corregido para solo sumar estados `['paid','processing','shipped','delivered']`.
- **filteredOrders memo bug**: `filterProvider` estaba ausente del array de dependencias del `useMemo` en `/admin/ordenes`. El filtro por proveedor de pago no se aplicaba. Corregido.
- **Email aprobación de reserva**: Nueva función `sendPickupApprovalEmail()` en `email.ts`. Cuando admin aprueba una reserva de retiro, el cliente recibe email con su código y el total a pagar en tienda.
- **approveReservation API**: Expandido `select` para obtener `guest_email`, `guest_name`, `guest_surname`, `pickup_code`, `total`, y campos de items. Llama `sendPickupApprovalEmail` de forma no-bloqueante tras aprobar.

---

## COMPLETADO: Mejoras post-Webpay (Marzo 27, 2026)

### Resumen
- **Timeline órdenes Webpay**: Admin `/ordenes/[id]` y `/mis-pedidos/[id]` ahora usan `webpayFlow = ['paid','processing','delivered']` detectado via `payment_provider === 'webpay'`. Ya no muestra el paso "Enviado" irrelevante.
- **Tarjeta acción admin**: Órdenes Webpay con `status='paid'` muestran card azul "Pago Webpay confirmado — Preparar pedido".
- **Admin lista órdenes — bug fix**: Columna "Pago" estaba hardcodeada a "Retiro" para todos. Ahora muestra "Webpay" (badge azul) o "Retiro" (badge ámbar) según `payment_provider`.
- **Filtro por método de pago**: Panel de filtros avanzados + chip de stat clickeable "Webpay a preparar".
- **Cron limpieza**: `GET /api/cron/cleanup-orders` cancela órdenes Webpay pendientes > 30 min y reservas de retiro expiradas. Configurado en `vercel.json` cada 30 min.
- **Fix Resend build**: Inicialización lazy del cliente Resend (evita error en build sin `RESEND_API_KEY`).
- **Emails**: `sendWebpayConfirmation()` y `sendPickupReservationEmail()` con templates HTML branded.
- **CRON_SECRET**: Agregar a Vercel env vars (cualquier string seguro, ej: `openssl rand -hex 32`).

---

## COMPLETADO: Integración Webpay Plus (Marzo 26, 2026)

### Resumen
- Reemplazó MercadoPago como método de pago online
- Instalado `transbank-sdk` npm
- Creado cliente singleton en `src/lib/transbank.ts` (integration/production por env vars)
- **Nuevas rutas API:**
  - `POST /api/webpay/create` — crea orden `pending` + transacción Transbank
  - `GET|POST /api/webpay/return` — maneja callback de Transbank, hace commit, descuenta stock
- **Nuevas páginas:**
  - `/checkout/webpay/success` — muestra comprobante + token para validación
  - `/checkout/webpay/error` — muestra error/cancelación + token para validación
- Checkout actualizado con selector de método de pago: Webpay Plus (default) o Pagar en tienda
- Todos los edge cases manejados: cancelación (TBK_TOKEN), rechazo, timeout, error de formulario
- Credenciales integración: commerce `597055555532`, api key `579B532A...`
- Credenciales producción: commerce `597053071648`, api key pendiente (enviado formulario validación a Transbank)
- **Validación Transbank enviada** — API key de producción llega en ~24h hábiles

### Env vars Vercel (producción)
- `TRANSBANK_ENVIRONMENT=integration` (cambiar a `production` cuando llegue API key)
- `TRANSBANK_COMMERCE_CODE` (agregar cuando sea producción)
- `TRANSBANK_API_KEY` (agregar cuando llegue de Transbank)
- `NEXT_PUBLIC_BASE_URL=https://tu-farmacia.cl`

### Activar producción (cuando llegue API key)
```bash
vercel env add TRANSBANK_ENVIRONMENT production --value production --force
vercel env add TRANSBANK_COMMERCE_CODE production --value 597053071648 --force
vercel env add TRANSBANK_API_KEY production --value <KEY> --force
git push origin main  # auto-deploy
```

---

## COMPLETADO: Setup entorno + verificación estado (Marzo 24, 2026)

### Resumen
- Instaladas dependencias `npm install` en `apps/web` (176 paquetes: resend, recharts, xlsx, etc.)
- Creado `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verificado via Supabase CLI (`supabase link --project-ref jvagvjwrjiekaafpjbit` + `db query --linked`) que **todas las migraciones ya están aplicadas**: tablas `stock_movements`, `admin_settings` (con seed data), columna `discount_percent` en `products`
- Confirmado que todos los planes de `docs/plans/` están **100% implementados** en código:
  - Stock management + historial + badge sidebar ✅
  - Reportes con Recharts + CSV export ✅
  - Alertas email con Resend ✅
  - Sistema de descuentos (homepage ofertas, badges, checkout, admin) ✅
  - Fix import Excel no-destructivo (UPSERT por external_id) ✅
  - Fix script Python imágenes (fallback queries, progress file, rate limit) ✅
- Build exitoso con `NODE_OPTIONS=--max-old-space-size=6144` (máquina requiere 6GB para build)

---

## COMPLETADO: Fixes de calidad y seguridad (Marzo 20, 2026)

### Mejoras implementadas

**Validaciones y UX checkout**:
- Dirección de envío ahora requerida para pagos con MercadoPago (antes era opcional, generando órdenes sin dirección)
- Indicador visual `*` en campo de dirección
- Placeholder mejorado con ejemplo: "Calle, número, departamento, ciudad..."

**Store pickup**:
- Tiempo de expiración de reserva extendido de 4 a 24 horas (más razonable para adultos mayores)

**Robustez**:
- `formatPrice()` ahora maneja NaN con guard: retorna `$0` en vez de `$NaN`

**Accesibilidad y textos admin**:
- Corregido acento: "Marcar leídas" en NotificationBell

---

## COMPLETADO: UX y Rendimiento (Marzo 20, 2026)

### Mejoras implementadas

**Detalle de pedido del cliente (`/mis-pedidos/[id]`)**:
- Timeline visual de estado del pedido (similar al admin pero orientado al cliente)
- Soporte para flujo de retiro en tienda y envío a domicilio
- Botón de imprimir pedido
- Enlace de WhatsApp para consultas sobre el pedido
- Etiqueta correcta "Retiro en tienda" vs "Envío" en resumen
- Fecha de expiración visible para reservas pendientes
- Conteo de productos en resumen

**Página de producto (`/producto/[slug]`)**:
- Sección de descripción del producto visible para el cliente

**Panel admin - Rendimiento**:
- Optimización de carga de stats: reemplazado fetch de 1000+ productos por queries con `stock_filter` (4 queries livianas en paralelo)
- Eliminado polling de localStorage cada 500ms; reemplazado por CustomEvent `sidebar-collapse` para comunicación sidebar-layout

**SEO y accesibilidad**:
- `robots.txt` con reglas de crawling (bloquea admin, api, auth, checkout)
- Corrección de acentos en página de error ("salió", "Ocurrió")

---

## COMPLETADO: Sistema de Descuentos (Marzo 4, 2026)

### Funcionalidad
- **Campo DB**: `products.discount_percent INTEGER NULL CHECK(1-99)` — requiere migración SQL manual en Supabase
- **Helper**: `discountedPrice(price, pct)` en `src/lib/format.ts` — Math.ceil, compatible con CLP
- **Cart store**: aplica precio con descuento en `subtotal` y `total`; `CartItem` incluye `original_price` y `discount_percent`
- **Admin productos**: columna "Descuento" en tabla con badge rojo `-X% OFF`; campo numérico en form con preview "Precio final: $..."
- **API PATCH** `/api/admin/products/[id]`: acepta `discount_percent` (0 → null en DB)
- **Homepage Ofertas**: carrusel horizontal entre buscador y categorías, solo si hay productos con descuento activos
- **Homepage grid**: badge `-X% OFF` + precio original tachado en cards con descuento
- **Checkout APIs**: `guest-checkout` y `store-pickup` usan precio con descuento en total y `price_at_purchase`

### Migración SQL requerida
```sql
ALTER TABLE products
ADD COLUMN discount_percent INTEGER DEFAULT NULL
CHECK (discount_percent > 0 AND discount_percent <= 99);
```

---

**Sitio live**: https://tu-farmacia.cl (también https://tu-farmacia.vercel.app)
**Admin**: https://tu-farmacia.cl/admin
  - timadapa@gmail.com / Admin123!

---

## COMPLETADO: Fix Imágenes en Importación de Productos (Marzo 2026)

### Bug crítico resuelto: importación destruía imágenes de productos

**Problema**: `scripts/import_to_supabase.js` hacía `DELETE` de todos los productos y pedidos antes de reimportar, dejando `image_url: null` en 1189 productos.

**Cambios**:
- `scripts/import_to_supabase.js`: reemplazado DELETE-all + insert con UPSERT no-destructivo. Carga existentes por `external_id`, actualiza precio/stock/etc sin tocar `image_url`, inserta solo productos verdaderamente nuevos.
- `apps/web/src/app/api/admin/products/import/route.ts`: añadido safety check antes de INSERT para filtrar productos que ya existen por `external_id` (previene duplicados cuando `diffProducts()` falla).
- `scripts/update_images_supabase.py`: mejoras — múltiples queries de fallback por producto (hasta 4), detección de rate limit + espera 30s, archivo de progreso `image_search_progress.json` para reanudar si se interrumpe, filtro de `.gif` y URLs largas.
- Instalado package `resend` (faltaba, bloqueaba build).

**Para recuperar imágenes perdidas**: ejecutar `python scripts/update_images_supabase.py` desde `pharmacy-ecommerce/scripts/`.

---

## COMPLETADO: Stock Management + Reportes + Alertas Email (Marzo 2026)

### 1. Gestión de Stock (`admin/productos`)
- **Edición inline**: click en el número de stock en la tabla → se convierte en input, Enter guarda, Escape cancela
- **StockModal** (`src/components/admin/StockModal.tsx`): botón 🕐 abre modal con stock actual, form para agregar/restar unidades, razón, e historial de movimientos
- **API**: `PATCH /api/admin/products/[id]/stock` — delta + reason → actualiza `products.stock` + inserta en `stock_movements`
- **API**: `GET /api/admin/products/[id]/stock` — devuelve historial de movimientos del producto
- **DB**: tabla `stock_movements` (id, product_id, delta, reason, admin_id, created_at) con RLS admin-only

### 2. Página de Reportes (`admin/reportes`)
- Período: 7d / 30d / 90d con botones rápidos
- KPIs: revenue total, órdenes pagadas, ticket promedio, productos distintos
- Gráficos (Recharts): ventas por día (line), revenue por categoría (pie), top 10 productos (bar horizontal)
- Tabla detallada con ranking de productos, exportable a CSV con BOM UTF-8
- Datos reales desde `order_items` — reemplaza datos simulados del dashboard
- **API**: `GET /api/admin/reportes?from=&to=`

### 3. Configuración (`admin/configuracion`)
- Form para `alert_email` y `low_stock_threshold`
- **DB**: tabla `admin_settings` (key, value) con seed: threshold=10, email=admin@pharmacy.com
- **API**: `GET/PATCH /api/admin/settings`

### 4. Alertas Email (Resend)
- Dependencia: `resend@^6.9.3`
- `src/lib/email.ts`: `sendLowStockAlert(email, products, threshold)`
- Trigger: al aprobar una reserva (`PUT /api/admin/orders/[id]` action=approve_reservation), si stock resultante ≤ umbral → email al admin
- No-blocking: error en email no falla la respuesta principal

### 5. Dashboard
- Gráfico "Top Productos" ahora usa datos reales de `order_items` via `/api/admin/reportes`
- Eliminada función `calculateTopProducts` que usaba datos simulados (`100 - stock`)

### 6. Sidebar
- Agregados links: "Reportes" (BarChart2) y "Configuracion" (Settings)

### Pendiente (requiere acción manual del usuario)
- Ejecutar migraciones SQL en Supabase dashboard (tablas `stock_movements` y `admin_settings`)
- Configurar `RESEND_API_KEY` en variables de entorno de Vercel
- Registrar dominio en Resend para enviar desde email propio (actualmente usa onboarding@resend.dev)

---

## COMPLETADO: Mejora Panel Admin Órdenes (Febrero 2026)

### Cambios realizados (`src/app/admin/ordenes/page.tsx`)
- **Stats bar**: 4 tarjetas con ingresos totales, total órdenes, pendientes, reservas. Las de pendientes y reservas son clickeables como filtros rápidos.
- **Columna Cliente**: nombre del cliente (guest o registrado) + email con icono
- **Columna Pago**: badge "MercadoPago" (azul) o "Retiro en tienda" (ámbar)
- **Búsqueda visible siempre**: barra de búsqueda fuera del panel de filtros, busca por ID + nombre + email
- **Chips de estado en filtros**: pills con colores por estado, sin abrir dropdowns
- **Paginación numerada**: botones con números de página + indicador "X–Y de Z"
- **CSV mejorado**: incluye nombre, email, teléfono, método de pago, código retiro (con BOM UTF-8 para Excel)
- **Refactor filtros**: `useMemo` para filtrado reactivo sin re-fetch

### Cambios en `src/lib/api.ts`
- Interface `Order`: agregados `guest_name`, `guest_surname`, `guest_email` (estaban solo en `OrderWithItems`)
- Interface `OrderWithItems`: eliminados campos duplicados (ahora heredados de `Order`)

---

## COMPLETADO: Importación Excel desde Admin (Febrero 2026)

### Problema
La importación de productos desde Excel solo se puede hacer por CLI (`scripts/import_to_supabase.js`) y ese script **borra todos los productos** antes de importar. Se necesita una importación inteligente desde el panel admin que detecte productos nuevos vs existentes y muestre los cambios antes de aplicarlos.

### Objetivo
Botón "Importar Excel" en admin/productos que:
1. Parsea Excel (.xlsx) en el navegador (misma estructura que `2026-01-19_LISTA_DE_PRECIOS.xlsx`)
2. Compara contra productos existentes usando `external_id`
3. Muestra vista previa: productos nuevos, cambios de stock/precio, sin cambios
4. Aplica cambios (INSERT nuevos + UPDATE existentes, nunca DELETE)
5. Muestra reporte de resultados

### Formato Excel esperado (16 columnas)
```
id | producto | laboratorio | departamento | accion_terapeutica |
principio_activo | unidades_presentacion | presentacion | receta |
control_legal | es_bioequivalente | registro_sanitario |
titular_registro | stock | precio | precio_por_unidad
```

### Archivos a crear/modificar

#### Nuevos
- `src/lib/excel-import.ts` — Parseo Excel + helpers (slugify, parsePrice, mapPrescriptionType, buildDescription) + constantes de categorías (DEPT_TO_CATEGORY, EXTRA_MAPPINGS) + función diffProducts()
- `src/app/api/admin/products/import/route.ts` — API endpoint: auth admin, resuelve categorías, genera slugs únicos, upsert por batches de 100

#### Modificados
- `package.json` — agrega dependencia `xlsx: ^0.18.5`
- `src/lib/api.ts` — agrega `productApi.bulkImport()`
- `src/app/admin/productos/page.tsx` — botón "Importar Excel" + modal de 3 pasos (upload → preview → results)

### Flujo UI
```
[Importar Excel] → Modal con file picker (.xlsx)
  → Parsea en browser + carga todos los productos de DB
  → Diff por external_id
  → Vista previa:
    - Tarjeta verde: N productos nuevos (tabla con nombre, lab, precio, stock)
    - Tarjeta azul: N productos a actualizar (tabla con stock old→new, precio old→new)
    - Tarjeta gris: N sin cambios
  → [Importar N productos] → API upsert en batches
  → Reporte: insertados + actualizados + errores
  → [Cerrar] → recarga lista
```

### Lógica de categorías (misma que script CLI)
1. Buscar `accion_terapeutica` en tabla `therapeutic_category_mapping`
2. Si no: buscar `departamento` en DEPT_TO_CATEGORY
3. Si no: slugificar departamento y buscar en categorías
4. Fallback: categoría 'otros'

### Notas técnicas
- Parseo client-side con `xlsx` (evita complejidad de file upload al server)
- Diffing por `external_id` (columna 'id' del Excel)
- Non-destructive: solo INSERT + UPDATE, nunca DELETE
- Upsert con `onConflict: 'external_id'`
- Batches de 100 para evitar timeouts

### Fix crítico post-implementación: productApi.list() cap de 100 items

**Problema detectado en code review**: `productApi.list()` tiene un cap duro de 100 items (`Math.min(params?.limit || 12, 100)` en api.ts). Al llamar `productApi.list({ limit: 10000 })` solo devolvía 100 productos — con 1189 productos en DB, los 1089 restantes se habrían marcado como "nuevos" en cada re-importación, creando duplicados masivos.

**Fix**: Creada función `loadAllProductsForDiff()` en `excel-import.ts` que consulta Supabase directamente en batches de 1000 hasta que no haya más datos. El componente admin ahora usa esta función en lugar de `productApi.list()`.

---

## COMPLETADO: Admin Mobile Responsive (Febrero 2026)

### Problema
Panel admin no era usable en celulares: tablas con min-w-[800px] forzaban scroll horizontal, dropdowns desbordaban la pantalla, touch targets muy pequeños, colores inconsistentes (gray vs slate).

### Cambios realizados (9 archivos, 7 fases)
- **Sidebar.tsx**: Hamburger touch target p-3, sidebar max-w-[85vw]
- **layout.tsx**: Padding responsive px-4 sm:px-6 lg:px-8
- **NotificationBell.tsx**: Dropdown max-w-[calc(100vw-2rem)], max-h-[60vh] sm:max-h-96
- **CommandPalette.tsx**: Resultados max-h-[50vh] sm:max-h-[400px]
- **admin/page.tsx**: Stat grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6
- **ordenes/page.tsx**: Tabla → cards en mobile (md:hidden), filtros sm:grid-cols-2
- **ordenes/[id]/page.tsx**: Quick actions grid-cols-1 sm:grid-cols-2, min-h-[44px]
- **productos/page.tsx**: Tabla → cards en mobile, filtros w-full sm:w-auto, form grid-cols-1 sm:grid-cols-2
- **categorias/page.tsx**: Header flex-col sm:flex-row, modal p-4 sm:p-6, botones min-h-[44px]
- **Todos los archivos admin**: gray-* → slate-* (178 ocurrencias) para consistencia de color

---

## COMPLETADO: Sistema de Aprobacion de Reservas (Febrero 2026)

### Problema
Las reservas para retiro en tienda (store-pickup) no tenian flujo de aprobacion: el admin no recibia notificacion, no podia aceptar/rechazar, y el stock no se reducia al reservar.

### Cambios realizados (8 archivos, 6 fases)

#### Fase 1: API (admin/orders/[id]/route.ts)
- Nuevo action `approve_reservation`: valida status='reserved', llama decrement_stock() por cada item, cambia a 'processing'
- Nuevo action `reject_reservation`: valida status='reserved', cambia a 'cancelled'

#### Fase 2: API Client (lib/api.ts)
- `orderApi.approveReservation(id)` y `orderApi.rejectReservation(id)`

#### Fase 3: Notificaciones
- NotificationBell: polling de ordenes 'reserved' con tipo 'reservation' (icono Store, color amber)
- Sidebar: badge amber para reservas pendientes
- Layout: carga stats de reservas para sidebar

#### Fase 4: Admin Lista Ordenes (admin/ordenes/page.tsx)
- Ordenes 'reserved': botones "Aprobar"/"Rechazar" en vez de dropdown de estado
- Confirmacion antes de ejecutar

#### Fase 5: Admin Detalle Orden (admin/ordenes/[id]/page.tsx)
- Seccion prominente con fondo amber: info cliente, telefono, email, codigo retiro, expiracion
- Botones grandes "Aprobar Reserva" (emerald) y "Rechazar" (rojo), min-h-56px
- Dropdown de estado deshabilitado para ordenes reservadas
- Timeline simplificado: reserved → processing → delivered

#### Fase 6: Paginas Cliente
- reservation/page.tsx: "Pendiente de aprobacion" + aviso de revision por farmacia
- mis-pedidos: badges contextuales para store-pickup (Pendiente aprobacion / Aprobado - Listo para retiro)
- mis-pedidos/[id]: seccion retiro en tienda con codigo y estado

### Flujo
```
Cliente reserva → status='reserved' (stock sin reducir)
  ├── Admin ACEPTA → status='processing' + stock reducido
  └── Admin RECHAZA → status='cancelled'
```

---

## COMPLETADO: Perfeccionamiento Frontend Tercera Edad (Febrero 2026)

### Problema
Inconsistencias en el frontend: emojis en categorias, colores `gray` vs `slate`, touch targets de 40-48px, text-sm en textos importantes, paginas success/failure/pending con estilos diferentes al resto.

### Cambios realizados (17 archivos, 7 fases)

#### Fase 1: Foundation (globals.css)
- `.btn`: min-h 48px→56px, rounded-xl→rounded-2xl
- `.btn-primary`: border→border-2
- `.card`: border→border-2
- `.input`: min-h 52px→56px

#### Fase 2: Layout + Navbar
- Navbar: h-16→h-72px, todos los botones min-h-56px
- Footer: text-sm→text-base, py-8→py-10
- Cart button: rounded-2xl, min-h-56px
- Dropdown items: min-h-56px

#### Fase 3: Homepage
- Emojis reemplazados por iconos Lucide profesionales (Pill, Heart, Brain, etc.)
- Category buttons: min-h-52→56px, text-sm→text-base, rounded-2xl
- Product card names: text-sm→text-base
- Add-to-cart: min-h-44→56px, text-base, rounded-2xl, border-2
- Search clear button: w-8→w-10
- Scroll-to-top: w-12→w-14

#### Fase 4: Producto + Carrito
- Back button: min-h-44→56px
- Quantity buttons: w-12→w-14 (producto), w-11→w-14 (carrito)
- Cart images: w-24→w-28
- Delete button: w-10→w-14
- Badges: text-sm→text-base, rounded-2xl
- Lab label: text-sm→text-base, removido uppercase

#### Fase 5: Checkout flow
- Success/Failure/Pending: reescritas completas
  - gray→slate, rounded-lg→rounded-2xl, border→border-2
  - Buttons: min-h-56px, font-bold text-lg
  - green→emerald para consistencia de marca
- Checkout: helper text slate-400→500, button min-h-60→64px

#### Fase 6: Auth + Mis Pedidos
- Login/Register: gray→slate, text-sm→text-base en labels, border-2, rounded-2xl
- Mis Pedidos: gray→slate, text-sm→text-base
- Mis Pedidos/[id]: gray→slate, green→emerald, back link min-h-56px

#### Fase 7: Cleanup
- Eliminados ProductCard.tsx y CartItem.tsx (componentes muertos)
- Build verificado sin errores
- Grep verificado: cero `text-gray`, `rounded-lg` o emojis en paginas de cliente

---

## COMPLETADO: Sistema de Skills para Claude Code (Febrero 2026)

### Que se hizo
Se implemento el sistema de "Skills" de Claude Code para mantener continuidad entre sesiones y automatizar tareas repetitivas.

### Archivos creados
- `CLAUDE.md` — Contexto del proyecto que Claude lee automaticamente cada sesion (stack, build, DB schema, gotchas, design rules)
- `.claude/commands/continuar.md` — Comando `/continuar`: retoma trabajo pendiente leyendo bitacora + handover
- `.claude/commands/deploy.md` — Comando `/deploy`: pipeline completo build → commit → push → verificar
- `.claude/commands/review.md` — Comando `/review`: revision de codigo (seguridad, calidad, buenas practicas)
- `.claude/commands/debug.md` — Comando `/debug`: framework sistematico de 7 pasos
- `.claude/commands/handover.md` — Comando `/handover`: genera resumen de sesion para continuidad
- `HANDOVER.md` — Documento de handover de la sesion anterior
- `GUIA-CLAUDE-CODE-SKILLS.md` — Guia en espanol explicando como funciona todo el sistema

### Commit
`4d7d471` — feat: add Claude Code skills system - CLAUDE.md, slash commands, and guide

---

## COMPLETADO: Rediseño Mobile-First para Tercera Edad (Febrero 2026)

### Problema
El sitio tenía texto pequeño (11-14px), botones diminutos, filtros complejos (sidebar, pills, dropdowns), y una UX pensada para usuarios tech-savvy. El público principal son adultos mayores en Coquimbo, Chile, que usan celular.

### Objetivo
Rediseño completo mobile-first: texto 18px+ base, botones 48px+ touch targets, interfaz extremadamente simple, perfecto en cualquier celular.

### Cambios realizados

#### 1. `globals.css` — Base tipográfica agrandada
- `html { font-size: 18px }` (antes ~14-16px)
- `.btn`: min-h-[48px], py-3.5, text-base
- `.btn-primary`: text-lg, sombra pronunciada
- `.input`: min-h-[52px], border-2, text-lg
- Body bg: white con antialiased

#### 2. `Navbar.tsx` — Header simplificado
- Una sola fila: Logo + Avatar usuario + Botón carrito
- Eliminado: botón "Iniciar Sesión" verde (reemplazado por icono avatar)
- Carrito prominente con emerald-50 bg y badge de count
- Menú usuario click-to-open con backdrop overlay
- Búsqueda movida al homepage inline

#### 3. `page.tsx` — Homepage reescrita completamente
- **ELIMINADO**: vista lista, sort dropdown, items-per-page, view mode toggle, paginación numérica, FilterSidebar, FilterDrawer, CategoryPills, ActiveFilters
- **AGREGADO**: Grid de categorías 2 cols con botones grandes (52px), búsqueda siempre visible (text-lg, border-2), "Cargar más" en vez de paginación, cards con botón "Agregar" full-width, barra carrito sticky bottom (64px)
- Filtro `in_stock: true` por defecto, 20 items por página acumulados

#### 4. `producto/[slug]/page.tsx` — Detalle de producto agrandado
- Precio: text-4xl font-black (antes text-3xl)
- Badges: px-3 py-1.5 rounded-xl text-sm (antes px-2.5 py-1 text-xs)
- Info table: py-3, border-2 (antes py-2.5, border)
- Botones +/-: w-12 h-12 (antes p-3), cantidad text-xl
- "Agregar al carrito": min-h-[64px] text-xl (antes py-4 text-lg)
- Envío/seguridad: iconos w-6 h-6 con bg rounded-xl
- Breadcrumb reemplazado por botón "Volver" simple
- Feedback visual: checkmark "Agregado" antes de navegar al carrito

#### 5. `carrito/page.tsx` — Carrito agrandado
- Imágenes: w-24 h-24 (antes w-20 h-20) con `<img>` directo
- Botones +/-: w-11 h-11 (antes p-1.5), cantidad text-lg font-bold
- Subtotal: text-lg font-black
- Botón eliminar: w-10 h-10 con hover bg-red-50
- Total: text-3xl font-black text-emerald-700
- "Continuar al pago": min-h-[56px] text-lg font-bold rounded-2xl
- Layout: stacked (no sidebar) para mobile

#### 6. `checkout/page.tsx` — Checkout agrandado
- Método pago cards: min-h-[80px], p-5, rounded-2xl, iconos w-7 h-7
- Labels: font-semibold text-slate-700
- Inputs: heredan .input (min-h-[52px] border-2 text-lg)
- Total: text-3xl font-black
- Botón pagar: min-h-[60px] text-lg font-bold
- Error msg: border-2 rounded-xl font-semibold
- Layout: stacked (no sidebar) para mobile

#### 7. `checkout/reservation/page.tsx` — Reserva agrandada
- Código retiro: text-5xl font-black (antes text-4xl)
- Botón copiar: min-w-[48px] min-h-[48px]
- Instrucciones: text-base (antes text-sm), space-y-3
- Botón "Seguir comprando": min-h-[56px] text-lg

#### 8. `layout.tsx` — Footer actualizado
- Nombre farmacia: text-lg font-bold
- Ubicación: "Coquimbo, Chile"
- Copyright con año dinámico
- Border-t-2 para visibilidad

### Build
- `next build` exitoso, 24 páginas, 0 errores TypeScript

### Plan detallado
Ver `.claude/plans/tranquil-discovering-alpaca.md`

---

## COMPLETADO: Sistema de Filtros + Descripciones (Febrero 2026)

### Cambios realizados
- 5 componentes de filtros creados (FilterContent, FilterSidebar, FilterDrawer, CategoryPills, ActiveFilters)
- Homepage refactoreada con sidebar filtros + pills
- Página de producto con badges (receta, bioequivalente, categoría) y tabla info estructurada
- **NOTA**: Los componentes de filtros fueron reemplazados por el rediseño mobile-first (categorías como grid simple)

---

## COMPLETADO: Corrección páginas de pago (Febrero 2026)

### Cambios
- Formato precios CLP corregido ($3990.00 → $3.990) en mis-pedidos
- Locale es-AR → es-CL para fechas
- Estado `reserved` agregado en mis-pedidos, admin/ordenes (4 archivos)
- checkout/failure rediseñado (no "Volver al carrito", sino "Volver a intentar")
- checkout/success, pending mejorados con Suspense wrappers

---

## Arquitectura

```
Next.js 14 (Vercel)
  ├─ Client: Supabase JS → Supabase DB (lecturas públicas: productos, categorías)
  ├─ Client: Supabase Auth (login, register, sesión con cookies)
  ├─ API Routes: checkout, guest-checkout, store-pickup, webhook MercadoPago
  ├─ API Routes: admin CRUD (productos, categorías, órdenes)
  └─ Cart: 100% localStorage (sin backend)
```

**Supabase**: `jvagvjwrjiekaafpjbit` (DB + Auth + RLS)
**Vercel**: `prj_OfRAgKGzo9TrgQY1C2isbIzVrIs7` (team `team_slBDUpChUWbGxQNGQWmWull3`)
**Pagos**: MercadoPago (CLP - pesos chilenos)

---

## Base de datos

- **1189 productos** importados desde Excel (`2026-01-19_LISTA_DE_PRECIOS.xlsx`)
- **17 categorías** profesionales farmacéuticas
- **156+ mapeos** terapéuticos (acción terapéutica → categoría)
- **RLS** habilitado en todas las tablas
- **Trigger** `handle_new_user()` auto-crea perfil al registrarse
- **Función** `is_admin()` para verificar rol admin

### Campos por producto
name, slug, description, price, stock, category_id, image_url, active,
external_id, laboratory, therapeutic_action, active_ingredient,
prescription_type (direct/prescription/retained), presentation

### 17 categorías
dolor-fiebre, sistema-digestivo, sistema-cardiovascular, sistema-nervioso,
sistema-respiratorio, dermatologia, oftalmologia, salud-femenina,
diabetes-metabolismo, antibioticos-infecciones, vitaminas-suplementos,
higiene-cuidado-personal, bebes-ninos, adulto-mayor, insumos-medicos,
productos-naturales, otros

---

## Historial completado

### 2026-04-02: Webpay Plus producción activado (COMPLETADA)

- Credenciales productivas configuradas en Vercel: `TRANSBANK_COMMERCE_CODE`, `TRANSBANK_API_KEY`, `TRANSBANK_ENVIRONMENT=production`
- Bug CRLF en env vars corregido (Windows echo → printf para evitar `\r`)
- Checkout habilitado: dos opciones — Retiro en tienda + Webpay Plus (tarjeta real)
- Cron cleanup-orders cambiado de `*/30 * * * *` → `0 3 * * *` (límite Hobby plan)
- Deploy directo vía Vercel CLI (repo desconectado de GitHub en Vercel)
- Fix `.vercel/project.json` en raíz del repo para deploy correcto
- URL producción: https://tu-farmacia.cl

### 2026-04-01: Webpay Plus deshabilitado en checkout (COMPLETADA)

- Checkout simplificado: solo retiro en tienda habilitado
- Webpay Plus visible como opción pero desactivada con badge "Próximamente"
- Todo el código Transbank/Webpay intacto (APIs, lib/transbank.ts) — listo para activar
- `transbank-sdk` instalado en node_modules para que compile
- 32 productos sin imagen → 0 (búsqueda automática DuckDuckGo + manual)
- Total productos activos con imagen: 1.453/1.453 (100%)

### 2026-02-08: Migración Railway → Supabase (COMPLETADA)

**Antes**: 3 microservicios Rust en Railway + PostgreSQL + Redis
**Después**: Supabase (DB+Auth) + Next.js API routes

### 2026-02-09: Importación de productos (COMPLETADA)

- 1189 productos importados desde Excel
- Búsqueda automática de imágenes: **1075/1188 (90.5%)**
- Corrección masiva http→https: 79 URLs corregidas

### 2026-02-08: Corrección errores checkout y Mixed Content (COMPLETADA)

- NEXT_PUBLIC_SITE_URL configurado
- Mixed Content DB: 24 productos http:// → https://
- sanitizeImageUrl() en api.ts
- guest-checkout: guarda guest_name/guest_surname
- Errores usuario amigables en checkout

---

## Archivos clave

```
apps/web/
├── src/lib/supabase/client.ts    # Cliente browser (anon key)
├── src/lib/supabase/server.ts    # Cliente server (service role)
├── src/lib/api.ts                # API de productos/órdenes
├── src/store/auth.ts             # Zustand auth (Supabase Auth)
├── src/store/cart.ts             # Zustand cart (localStorage)
├── src/middleware.ts              # Auth session refresh
├── src/app/api/                  # 10 API routes
├── src/app/page.tsx              # Homepage mobile-first (REDISEÑADO)
├── src/app/producto/[slug]/page.tsx  # Detalle producto (REDISEÑADO)
├── src/app/carrito/page.tsx      # Carrito (REDISEÑADO)
├── src/app/checkout/page.tsx     # Checkout (REDISEÑADO)
├── src/app/checkout/reservation/page.tsx  # Reserva (REDISEÑADO)
├── src/components/Navbar.tsx     # Navbar simplificado (REDISEÑADO)
└── src/app/globals.css           # Base 18px (REDISEÑADO)

scripts/
├── import_to_supabase.js         # Importar Excel → Supabase
└── update_images_supabase.py     # Buscar imágenes DuckDuckGo

supabase/migrations/
└── 20240101000000_initial_schema.sql  # Schema idempotente
```

## REGISTRADO: Auditoría sistema previa a plan Golan (Abril 19, 2026)

### Resumen
Sesión de verificación y documentación del estado actual del sistema Tu Farmacia. Usuario solicito DETENER todo desarrollo y SOLO registrar hallazgos. Se confirmo que dos features solicitadas *ya estaban completamente implementadas* en producción:

1. **RUT Obligatorio en Registro**: Campo RUT con validacion modulo-11 chileno, formato 12.345.678-9, aviso "Necesario para acumular puntos de fidelidad". Archivo: `src/app/auth/register/page.tsx` (RUT validacion, formateo) + `src/app/api/auth/register/route.ts` (API guarda rut en profiles.rut)

2. **Importacion PDF Facturas**: Wizard 4-pasos en `src/app/admin/compras/nueva/page.tsx`:
   - Paso 1: Seleccionar proveedor
   - Paso 2: Subir foto JPEG/PNG o PDF de factura
   - Paso 3: Revision OCR + mapeo de productos a catalogo
   - Paso 4: Confirmar recepcion (stock++, cost_price, movimientos)
   - Backend: `src/app/api/admin/purchase-orders/scan/route.ts` usa Google Cloud Vision API (tanto `images:annotate` para fotos como `files:annotate` para PDFs), parsea lineas con heuristica numerica, busca matches en `supplier_product_mappings`

### Archivos inspeccionados
- `src/app/auth/register/page.tsx` (243 lineas) — RUT input con formateo inline, validacion modulo-11
- `src/app/api/auth/register/route.ts` (52 lineas) — POST route, recibe rut, valida, upsert profile
- `src/app/admin/compras/nueva/page.tsx` (gran archivo) — Complete 4-step wizard for POs
- `src/app/api/admin/purchase-orders/scan/route.ts` (169 lineas) — OCR endpoint, Vision API integration, parseInvoiceLines heuristic parser
- `prisma/schema.prisma` — profiles.rut (String?, VarChar(20)), products.cost_price, purchase_order_items.unit_cost
- `pharmacy-ecommerce/context.md` (183 lineas) — Sistema snapshots a abril 13, 2026 con todas las features completadas
- `context.md` (raiz) (412 lineas) — Documentacion completa stack, infraestructura, credentials, arquitectura
- `golan_info.md` — Extenso registro de features de Golan ERP a reemplazar

### Hallazgos clave
- **Sistema en produccion**: Webpay Plus activo con commerce code real (597053071888), Transbank integration completa
- **RUT validation**: Implementa algoritmo modulo-11 correcto para RUTs chilenos (7-9 digitos + digito verificador)
- **PDF OCR**: Google Cloud Vision API configurada para parsear facturas, extrae lineas de producto con cantidad/precio/subtotal via heuristica numerica
- **POS completamente funcional**: Electron app + scanner HID, busqueda por barcode en product_barcodes
- **Loyalty program**: Puntos por $1,000 CLP (1 punto = $100 descuento), sistema activo
- **Email integrations**: Resend configurado, emails transaccionales para Webpay, reservas, alertas stock
- **Admin features**: Reportes con Recharts, stock movements, supplier management, purchase orders, inventory valuation
- **Context files**: Context.md y golan_info.md ya existen con documentacion exhaustiva

### Plan para proxima sesion
Usuario solicito documentacion para SIGUIENTE sesion crear plan completo reemplazo Golan ERP. Siguientes features pendientes (no implementadas aun):
- Margen & Cost Analysis (precio vs costo vs margen para todos productos) — direcciona preocupacion Alex sobre viabilidad descuentos
- Cotizaciones/Presupuestos (quotes formales para clientes institucionales)
- Cuaderno de Faltas (logging de solicitudes out-of-stock)
- Expiry date tracking + liquidation alerts

### Notas tecnicas
- RUT validation uses modulo-11 algorithm con multiplicadores 2-7 cycling
- PDF OCR usa `vision.googleapis.com/v1/files:annotate` con type `DOCUMENT_TEXT_DETECTION` (no image:annotate)
- parseInvoiceLines() heuristica: busca numeros en linea, asume ultimo=subtotal, penultimo=unit_cost, anterior=quantity si hay 3+ numeros
- Supplier product mapping: tabla `supplier_product_mappings` con `(supplier_id, supplier_code)` composite key, lookup durante OCR review
- Cost tracking: purchase_order_items.unit_cost guardado al recibir OC, productos.cost_price actualizado, movimientos registrados

---

## Notas técnicas

- MercadoPago usa `CLP` (pesos chilenos), precios redondeados con `Math.ceil()`
- Webhooks usan idempotency check para evitar double-processing
- Store pickup genera código de 6 dígitos, expira en 48h
- Guest checkout permite comprar sin cuenta (user_id = NULL)
- `vercel link` puede sobrescribir `.env.local` - siempre hacer backup
- Deploy via `git push origin main` (auto-deploy GitHub integration)
- Root dir en Vercel: `pharmacy-ecommerce/apps/web`
- **Build**: usar `./node_modules/.bin/next build` (NO `npx next build` que usa v16)
- **Diseño**: Mobile-first, 18px base, 48px+ touch targets, alto contraste
