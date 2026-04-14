# Tu Farmacia - Project Context

## Overview
E-commerce de farmacia para adultos mayores en Coquimbo, Chile.
- **Live**: https://tu-farmacia.cl (también https://tu-farmacia.vercel.app)
- **Admin**: https://tu-farmacia.cl/admin
- **Repo root**: Este directorio
- **Web app**: `pharmacy-ecommerce/apps/web`

## Stack
- Next.js 14.2.35 + Tailwind CSS 3 + TypeScript
- **Firebase Auth** (Email/Password) — browser: `firebase/auth`, server: `firebase-admin`
- **Cloud SQL PostgreSQL 15 (GCP)** — proyecto `tu-farmacia-prod`, región `southamerica-east1`
- **Prisma 7** con `@prisma/adapter-pg` + `@google-cloud/cloud-sql-connector` (IAM auth, sin IP whitelist en producción)
- Transbank Webpay Plus (`transbank-sdk`) — **PRODUCCIÓN ACTIVA** commerce `597053071888`
- Resend para emails transaccionales
- Zustand (cart en localStorage, auth con Firebase)
- Recharts para gráficos en el dashboard admin
- Vercel (deploy automático via `git push origin main`)

> ⚠️ **Supabase fue migrado completamente.** No usar Supabase SDK, RLS, ni `auth.uid()`. La DB es Cloud SQL estándar PostgreSQL. Las vars `NEXT_PUBLIC_SUPABASE_*` ya fueron eliminadas de Vercel.

## Build & Deploy
- **IMPORTANTE**: Usar `./node_modules/.bin/next build` desde `apps/web/`, NUNCA `npx next build` (npx trae Next.js 16 del cache)
- **Memoria**: `NODE_OPTIONS=--max-old-space-size=6144` requerido en esta máquina para evitar OOM durante build
- **Bash paths**: Usar Unix `/c/Users/Admin/...` no Windows `C:\Users\Admin\...`
- **gcloud NO está en PATH**: usar `GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"`
- **Vercel root dir**: `pharmacy-ecommerce/apps/web`
- **Deploy**: `git push origin main` → auto-deploy en Vercel

## Database (Cloud SQL PostgreSQL 15)
- ~1482 productos, 17 categorías
- **Sin RLS** — seguridad via Firebase Auth + verificación server-side en API routes
- Tablas: products, categories, orders, order_items, profiles, therapeutic_category_mapping, admin_settings, stock_movements, suppliers, purchase_orders, purchase_order_items, supplier_product_mappings, loyalty_transactions, product_barcodes
- Campos producto: name, slug, price, stock, category_id, image_url, laboratory, therapeutic_action, active_ingredient, prescription_type, presentation, discount_percent, external_id, cost_price
- Ordenes guest: user_id = NULL, usan guest_email, guest_name, guest_surname, customer_phone
- Ordenes de usuarios autenticados: user_id = Firebase UID (string, no UUID)
- Store pickup: status='reserved', pickup_code (6 dígitos), reservation_expires_at (24h)
- Stock: se descuenta directamente con Prisma `$transaction` + `update` atómico
- admin_settings: tabla key/value para alert_email y low_stock_threshold (default 10)
- product_barcodes: códigos de barra EAN por producto (relación 1→N)

## Autenticación
- Firebase Auth (no Supabase)
- `getAdminUser()` en `api-helpers.ts` — verifica session cookie con `firebase-admin`
- `getAuthenticatedUser()` — idem para usuarios normales
- `middleware.ts` usa `decodeJwtPayload()` (Edge Runtime, sin firebase-admin)
- **NUNCA usar firebase-admin en middleware.ts** — Edge Runtime no lo soporta

## Migraciones de Schema
Para cambios de schema en producción:
```bash
# 1. Editar prisma/schema.prisma
# 2. Autorizar IP en Cloud SQL:
GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
MY_IP=$(curl -s https://api.ipify.org)
"$GCLOUD" sql instances patch tu-farmacia-db --authorized-networks="$MY_IP/32" --project=tu-farmacia-prod
# 3. Aplicar schema:
cd pharmacy-ecommerce/apps/web
DATABASE_URL="postgresql://farmacia:srcmlaYhkEo19YivrG4FDLH0woou@34.39.232.207:5432/farmacia" \
  ./node_modules/.bin/prisma db push
# 4. Para SQL custom, usar gcloud sql connect:
"$GCLOUD" sql connect tu-farmacia-db --user=farmacia --database=farmacia --project=tu-farmacia-prod
# 5. Limpiar IP:
"$GCLOUD" sql instances patch tu-farmacia-db --clear-authorized-networks --project=tu-farmacia-prod
```

## Arquitectura de páginas
```
/ (homepage)                  → Grid categorias + productos + busqueda + "cargar mas"
/producto/[slug]              → Detalle producto + agregar al carrito
/carrito                      → Carrito (localStorage) + control de stock
/checkout                     → Formulario + metodo pago (Webpay Plus o retiro tienda)
/checkout/webpay/success      → Confirmacion Webpay Plus
/checkout/webpay/error        → Error/cancelacion Webpay
/checkout/reservation         → Codigo retiro tienda
/auth/login                   → Inicio de sesion Firebase (preserva ?redirect=)
/auth/register                → Registro (preserva ?redirect=, Suspense boundary)
/auth/forgot-password         → Recuperar contraseña (email Firebase)
/auth/reset-password          → Nueva contraseña (oobCode en query string)
/mis-pedidos                  → Ordenes del usuario (requiere auth)
/mis-pedidos/[id]             → Detalle de orden + timeline de estado
/admin/*                      → Panel admin (requiere role:admin en Firebase claim)
```

## API Routes
```
POST     /api/webpay/create                        → Crea orden pending + transaccion Transbank
GET|POST /api/webpay/return                        → Callback de Transbank, commit, actualiza a paid
POST     /api/store-pickup                         → Crea orden reserved con pickup_code (24h expiry)
GET      /api/cron/cleanup-orders                  → Cancela ordenes expiradas (cron 3AM UTC)
GET      /api/admin/orders                         → Lista ordenes
PUT      /api/admin/orders/[id]                    → Actualiza estado orden + restaura stock si cancela
PUT      /api/admin/orders/[id] {action:approve}   → Aprueba retiro: descuenta stock, envia email
PUT      /api/admin/orders/[id] {action:reject}    → Rechaza retiro, envia email
GET      /api/admin/reportes                       → KPIs, ventas por dia, top productos, por categoria
CRUD     /api/admin/products                       → Admin productos (con import Excel)
POST     /api/admin/products/import                → Import masivo Excel (batches paralelos, maxDuration=300)
CRUD     /api/admin/categories                     → Admin categorias
GET|PATCH /api/admin/settings                      → Configuracion (email alertas, umbral stock)
GET      /api/admin/clientes                       → Lista clientes registrados + guests
GET|PUT|DELETE /api/admin/clientes/[id]            → Detalle, editar o eliminar cliente registrado
GET      /api/admin/clientes/guest?email=xxx       → Detalle + historial cliente guest
POST     /api/auth/session                         → Crea session cookie desde Firebase ID token
DELETE   /api/auth/session                         → Logout
POST     /api/auth/register                        → Registro via Firebase Admin
CRUD     /api/admin/suppliers                      → Proveedores
CRUD     /api/admin/purchase-orders                → Ordenes de compra
POST     /api/admin/purchase-orders/[id]/receive   → Recibe OC: stock++, cost_price, movements
POST     /api/admin/purchase-orders/scan           → OCR Vision API
POST     /api/admin/pos/sale                       → Venta POS: orden completed + stock-- atomico
GET      /api/admin/stock-movements                → Lista movimientos de stock
POST     /api/admin/stock-movements/adjust         → Ajuste manual de stock
GET      /api/admin/inventory                      → Inventario valorizado
GET      /api/products?barcode=<ean>               → Busca por codigo de barra en product_barcodes
```

## Gotchas conocidos
- **NO hay RLS ni Supabase** — no usar `auth.uid()`, `auth.role()`, ni Supabase client
- `getAdminUser()` y `getAuthenticatedUser()` verifican Firebase session cookie
- `orderApi.adminGet(id)` → `GET /api/admin/orders/[id]` para que admin vea cualquier orden
- Webpay buyOrder max 26 chars: UUID sin guiones truncado a 26 chars
- CLP no tiene decimales: usar `Math.round()` al pasar montos a Transbank
- Las imagenes pueden tener `http://` — `sanitizeImageUrl()` en api.ts convierte a `https://`
- `isPickup` siempre usar `payment_provider === 'store'`, NO `!!order.pickup_code`
- `fetch` no lanza error en 4xx/5xx — siempre chequear `res.ok` antes de mostrar exito
- Cart items tienen campo `stock: number` — el boton "+" deshabilitado si `quantity >= stock`
- `catch {}` silente en búsquedas del POS = "Sin resultados" engañoso. Siempre mostrar el error
- `firebase-admin` NUNCA en `middleware.ts` — Edge Runtime no lo soporta
- `getDb()` es async — siempre `await getDb()`
- `GOOGLE_SERVICE_ACCOUNT` se parsea con `JSON.parse()` — debe ser JSON válido como string
- Busqueda por barcode en POS: `?barcode=<ean>` busca en `product_barcodes.barcode`, fallback a `external_id`

## Diseño y UI
- Mobile-first para adultos mayores
- Font base 18px, touch targets 48px+, alto contraste
- Colores: emerald-600 primario, slate para texto
- Cards: rounded-2xl, border-2
- Sin filtros complejos: solo categorias (grid) + busqueda
- Dark mode: soportado en todas las paginas con clases `dark:*`
- Admin mobile: barra de navegacion inferior fija (bottom nav), badges con contadores
- Admin desktop: sidebar lateral colapsable (64px / 256px)
- overflow-x: hidden en html y body para evitar scroll horizontal en movil

## Variables de entorno (Vercel + .env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
FIREBASE_PROJECT_ID
FIREBASE_STORAGE_BUCKET
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
GOOGLE_SERVICE_ACCOUNT          # JSON completo del service account GCP
CLOUD_SQL_INSTANCE=tu-farmacia-prod:southamerica-east1:tu-farmacia-db
DB_USER=farmacia
DB_PASSWORD=srcmlaYhkEo19YivrG4FDLH0woou
DB_NAME=farmacia
DATABASE_URL=postgresql://farmacia:srcmlaYhkEo19YivrG4FDLH0woou@34.39.232.207:5432/farmacia
TRANSBANK_ENVIRONMENT=production
TRANSBANK_COMMERCE_CODE=597053071888
TRANSBANK_API_KEY
RESEND_API_KEY
CRON_SECRET
NEXT_PUBLIC_BASE_URL=https://tu-farmacia.cl
GOOGLE_CLOUD_VISION_API_KEY
```

## Bitacora
Despues de cada cambio significativo, actualizar `pharmacy-ecommerce/bitacora.md` con los cambios realizados.

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Ask yourself: "Would a staff engineer approve this?"

### 5. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding

## Task Management
1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Track Progress**: Mark items complete as you go
3. **Document Results**: Add review section to `tasks/todo.md`
4. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Obsidian Mind Vault (PKM)

Vault instalado en `C:\Users\Admin\Documents\obsidian-mind`. Cerebro externo del proyecto.

| Qué guardar | Dónde en el vault |
|---|---|
| Patrones y gotchas del codebase | `brain/Patterns.md`, `brain/Gotchas.md` |
| Decisiones arquitectónicas | `brain/Key Decisions.md` |
| Fases ERP activas | `work/active/` |
| Contexto de stack y arquitectura | `reference/Tu Farmacia Architecture.md` |
| Objetivos del producto | `brain/North Star.md` |

### Reglas
- Conocimiento durable → vault `brain/`, no en memoria efímera
- Al terminar sesión significativa, actualizar `brain/Gotchas.md`
