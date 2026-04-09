# Tu Farmacia — Contexto Completo del Proyecto

> **Punto de entrada para cualquier sesión nueva.**
> Lee este archivo primero. Tiene todo: estado, credenciales, stack, reglas, herramientas.
> Última actualización: 2026-04-08

---

## 1. Estado Actual — PRODUCCIÓN LIVE ✅

**App:** https://tu-farmacia.cl (también https://tu-farmacia.vercel.app)
**Admin:** https://tu-farmacia.cl/admin

| Componente | Estado |
|---|---|
| Next.js 14.2.35 + Tailwind 3 + TypeScript | ✅ Live |
| Firebase Auth (Email/Password) | ✅ Activo |
| Cloud SQL PostgreSQL 15 (GCP) | ✅ Conectado — 1482 productos, 17 categorías |
| Transbank Webpay Plus | ✅ **Producción activa** (Commerce: `597053071888`) |
| Retiro en tienda (store pickup) | ✅ Operativo |
| Dark mode (warm-neutral palette) | ✅ Completo en todas las páginas |
| Admin panel | ✅ Operativo |
| Emails transaccionales (Resend) | ✅ Configurado |
| Cron limpieza de órdenes | ✅ Configurado (3 AM UTC diario) |

---

## 2. Sistema y Rutas

- **OS:** Windows 10 Pro (Build 19045)
- **Shell:** bash (Git Bash) — usar rutas Unix (`/c/Users/Admin/...`) NO Windows
- **CWD:** `C:\Users\Admin\Documents\GitHub\build-and-deploy-webdev-asap`
- **Web app:** `pharmacy-ecommerce/apps/web`
- **Bash paths importantes:**
  ```bash
  # gcloud NO está en PATH de bash — usar:
  GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
  # gh está en PATH
  ```

---

## 3. Stack Técnico

```
Next.js 14.2.35 (App Router)
Tailwind CSS 3
TypeScript (strict: true, noImplicitAny: false)
Prisma 7.7.0 (driverAdapters — ya estable, sin previewFeatures)
@google-cloud/cloud-sql-connector (IAM auth, sin IP whitelist)
Firebase Auth (browser: firebase/auth, server: firebase-admin)
Zustand (cart en localStorage, auth con Firebase)
Transbank SDK (Webpay Plus, producción)
Resend (emails transaccionales)
Recharts (gráficos admin dashboard)
Vercel (deploy automático via git push origin main)
```

---

## 4. Credenciales y Variables de Entorno

### Admin de la app
| Campo | Valor |
|---|---|
| Email | `timadapa@gmail.com` |
| Password | `TuFarmacia2026!` |
| Firebase UID | `mUgyCPYUqxZFYjCWexeZSmNMvsS2` |
| Custom claim | `{"role":"admin"}` |

### Firebase (proyecto `tu-farmacia-prod`)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC9k3tw3ckVIim5G9K6lxX1exOb7LdqnRU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-farmacia-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-farmacia-prod
FIREBASE_PROJECT_ID=tu-farmacia-prod
FIREBASE_STORAGE_BUCKET=tu-farmacia-prod.firebasestorage.app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@tu-farmacia-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n[ver .env.local]\n-----END PRIVATE KEY-----\n
```

### Cloud SQL (PostgreSQL 15)
```
GOOGLE_SERVICE_ACCOUNT=[JSON completo — ver .env.local]
CLOUD_SQL_INSTANCE=tu-farmacia-prod:southamerica-east1:tu-farmacia-db
DB_USER=farmacia
DB_PASSWORD=srcmlaYhkEo19YivrG4FDLH0woou
DB_NAME=farmacia
DATABASE_URL=postgresql://farmacia:srcmlaYhkEo19YivrG4FDLH0woou@34.39.232.207:5432/farmacia
```

### Transbank (PRODUCCIÓN ACTIVA)
```
TRANSBANK_ENVIRONMENT=production
TRANSBANK_COMMERCE_CODE=597053071888
TRANSBANK_API_KEY=[encriptado en Vercel]
```

### Otros
```
NEXT_PUBLIC_BASE_URL=https://tu-farmacia.cl
GOOGLE_CLOUD_VISION_API_KEY=AIzaSyBvh-lRmzwPjvCCeyKm3zry2v50JCTeJUs
RESEND_API_KEY=[encriptado en Vercel]
CRON_SECRET=d87aeb48c620b9a0b904cefb902ff9ecca251260b213c5b008fe07b435aa045c
```

> **NOTA:** Variables Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) aún presentes en Vercel pero **no se usan** — el código fue migrado completamente a Firebase + Cloud SQL. Eliminar cuando se confirme que producción funciona bien:
> ```bash
> vercel env rm NEXT_PUBLIC_SUPABASE_URL production
> vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production
> vercel env rm SUPABASE_SERVICE_ROLE_KEY production
> ```

---

## 5. Infraestructura GCP

| Recurso | Valor |
|---|---|
| GCP Project | `tu-farmacia-prod` |
| GCP Account | `timadapa@gmail.com` |
| Cloud SQL Instance | `tu-farmacia-db` |
| Cloud SQL Region | `southamerica-east1-b` |
| Cloud SQL IP pública | `34.39.232.207` |
| Cloud SQL Outgoing IP | `35.247.253.253` |
| DB Name | `farmacia` |
| DB User | `farmacia` |
| Service Account | `firebase-adminsdk-fbsvc@tu-farmacia-prod.iam.gserviceaccount.com` |
| Service Account JSON | `tu-farmacia-prod-1d6e516dbae2.json` (repo root, **gitignored**) |
| Firebase Web App ID | `1:164275006028:web:0bcb105734e84a2f7be2e9` |

---

## 6. Vercel

| Campo | Valor |
|---|---|
| Team ID | `team_slBDUpChUWbGxQNGQWmWull3` |
| Project ID | `prj_OfRAgKGzo9TrgQY1C2isbIzVrIs7` |
| Root dir | `pharmacy-ecommerce/apps/web` |
| Node.js | 24.x |
| Dominios | `tu-farmacia.cl`, `www.tu-farmacia.cl`, `tu-farmacia.vercel.app` |
| Deploy | `git push origin main` → auto-deploy |

---

## 7. Build & Deploy

```bash
# Build LOCAL — SIEMPRE desde apps/web/
cd /c/Users/Admin/Documents/GitHub/build-and-deploy-webdev-asap/pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build
# NUNCA: npx next build (trae Next.js 16 del cache)

# Build script en package.json ya incluye prisma generate:
# "build": "prisma generate && next build"

# Deploy → solo hacer push
git push origin main
```

**Reglas críticas:**
1. `firebase-admin` NUNCA en `middleware.ts` — Edge Runtime no lo soporta
2. `Firebase client.ts` solo inicializa en browser (`typeof window !== 'undefined'`)
3. `getDb()` es async — siempre `await getDb()`
4. `GOOGLE_SERVICE_ACCOUNT` se parsea con `JSON.parse()` — debe ser JSON válido como string
5. `isPickup` → usar `payment_provider === 'store'`, NUNCA `!!order.pickup_code`
6. Webpay buyOrder max 26 chars: UUID sin guiones, truncado a 26
7. CLP sin decimales: `Math.round()` al pasar montos a Transbank

---

## 8. Arquitectura de Autenticación

```
Browser
  └── Firebase Client SDK (signInWithEmailAndPassword)
        └── POST /api/auth/session { idToken }
              └── adminAuth.createSessionCookie(idToken, 14 días)
                    └── 'session' cookie (httpOnly, secure, sameSite: lax)
                          │
                          ├── middleware.ts: decodeJwtPayload() — atob(), Edge Runtime
                          │   Comprueba role === 'admin' para /admin/*
                          │   NO usa firebase-admin (incompatible con Edge)
                          │
                          └── API routes: adminAuth.verifySessionCookie() — Node.js
                              Verificación criptográfica completa
```

**Custom claims:** `role: 'admin'` se setea con `adminAuth.setCustomUserClaims(uid, { role: 'admin' })`.
El claim viaja en el ID token → se preserva en el session cookie.

**Para crear nuevo admin:**
```bash
cd pharmacy-ecommerce/apps/web
# Crear script temporal set-admin.mjs con firebase-admin
# o usar Firebase Console → Authentication → Users → Edit user → Custom claims
```

---

## 9. Arquitectura DB

```
Vercel Function (Node.js)
  └── src/lib/db.ts → getDb()
        └── @google-cloud/cloud-sql-connector (IAM, no IP whitelist)
              └── pg.Pool → PrismaPg adapter → PrismaClient

# Para CLI (prisma db push, prisma studio):
# Requiere autorizar IP en Cloud SQL temporalmente:
GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
MY_IP=$(curl -s https://api.ipify.org)
"$GCLOUD" sql instances patch tu-farmacia-db \
  --authorized-networks="$MY_IP/32" --project=tu-farmacia-prod
# Después limpiar:
"$GCLOUD" sql instances patch tu-farmacia-db \
  --clear-authorized-networks --project=tu-farmacia-prod
```

---

## 10. Arquitectura de Páginas y API Routes

```
/                       → Homepage (productos + categorías + búsqueda)
/producto/[slug]        → Detalle producto
/carrito                → Carrito (localStorage)
/checkout               → Formulario + Webpay / Retiro
/checkout/webpay/success → Confirmación Webpay
/checkout/webpay/error  → Error/cancelación Webpay
/checkout/reservation   → Código retiro tienda
/auth/login             → Login Firebase
/auth/register          → Registro
/auth/forgot-password   → Reset password (envía email Firebase)
/auth/reset-password    → Nueva password (oobCode en query string)
/mis-pedidos            → Órdenes del usuario (requiere auth)
/mis-pedidos/[id]       → Detalle orden + timeline
/admin/*                → Panel admin (requiere role:admin)

API Routes:
POST   /api/webpay/create          → Crea orden pending + transacción Transbank
GET|POST /api/webpay/return        → Callback Transbank, commit, actualiza a paid
POST   /api/store-pickup           → Crea orden reserved con pickup_code (24h)
GET    /api/cron/cleanup-orders    → Cancela órdenes expiradas (cron 3AM UTC)
GET    /api/admin/orders           → Lista órdenes
PUT    /api/admin/orders/[id]      → Actualiza estado (approve/reject/cancel)
CRUD   /api/admin/products         → Productos (con import Excel)
CRUD   /api/admin/categories       → Categorías
GET|PATCH /api/admin/settings      → alert_email, low_stock_threshold
GET    /api/admin/clientes         → Lista clientes
GET|PUT|DELETE /api/admin/clientes/[id] → Detalle/editar/eliminar cliente
POST   /api/auth/session           → Crea session cookie desde ID token
DELETE /api/auth/session           → Logout (borra session cookie)
POST   /api/auth/register          → Registro via Firebase Admin
```

---

## 11. Archivos Clave del Código

```
src/lib/db.ts                          ← Prisma + Cloud SQL connector
src/lib/firebase/admin.ts              ← Firebase Admin SDK (lazy proxy)
src/lib/firebase/client.ts             ← Firebase browser SDK (browser-only)
src/lib/firebase/api-helpers.ts        ← getAuthenticatedUser, getAdminUser
src/lib/firebase/middleware.ts         ← JWT decode (Edge Runtime, sin firebase-admin)
src/lib/transbank.ts                   ← Webpay Plus client (prod/integration)
src/lib/email.ts                       ← Resend emails transaccionales
src/middleware.ts                      ← Next.js middleware → updateSession()
src/store/auth.ts                      ← Zustand auth (Firebase)
src/store/cart.ts                      ← Zustand cart (localStorage)
src/app/api/auth/session/route.ts      ← Session cookie creation/deletion
prisma/schema.prisma                   ← Schema Prisma
prisma.config.ts                       ← Prisma 7 config (DATABASE_URL para CLI)
vercel.json                            ← Cron: cleanup-orders (0 3 * * *)
.vercel/project.json                   ← Link al proyecto Vercel
tu-farmacia-prod-1d6e516dbae2.json    ← Service account key (GITIGNORED)
```

---

## 12. CLIs Disponibles

| CLI | Versión | Notas |
|---|---|---|
| `node` | v24.x | Runtime |
| `npm` | 11.x | Package manager |
| `vercel` | 50.37.0 | Deploy + env vars |
| `firebase` | 15.11.0 | Firebase CLI |
| `gcloud` | 564.0.0 | **NO está en PATH** — usar path completo |
| `git` | 2.x | Control de versiones |
| `gh` | 2.89.0 | GitHub CLI |
| `docker` | 29.x | Contenedores |

---

## 13. Obsidian Mind Vault (PKM)

Vault instalado en `C:\Users\Admin\Documents\obsidian-mind` (v3.7.0).
Cerebro externo del proyecto — decisiones, gotchas, arquitectura, fases ERP.

| Folder vault | Contenido Tu Farmacia |
|---|---|
| `brain/Patterns.md` | Patrones del codebase (Firebase Edge, Prisma gotchas, etc.) |
| `brain/Gotchas.md` | Gotchas conocidos (Webpay 26 chars, CLP sin decimales, etc.) |
| `brain/Key Decisions.md` | Decisiones: migración Supabase→Firebase, Cloud SQL, Transbank prod |
| `brain/North Star.md` | Objetivos del producto: ERP completo, POS, reportes financieros |
| `reference/` | Arquitectura: Auth flow, DB schema, API routes map |
| `work/active/` | Fases ERP activas (Fase 1: Proveedores + Compras) |
| `work/archive/` | Fases completadas |

**Comandos útiles desde el vault** (correr con `claude` dentro de `obsidian-mind/`):
- `/om-standup` — kickoff de sesión con contexto completo
- `/om-wrap-up` — cierre: archiva, actualiza índices, captura learnings
- `/om-dump` — captura rápida de cualquier idea/decisión

---

## 14. Plugins Claude Code  <!-- was 13 -->

| Plugin | Para qué sirve |
|---|---|
| `vercel` | Deploy, env vars, logs, documentación Vercel (MCP) |
| `firebase` | Firebase Auth, Firestore, operaciones Firebase (MCP) |
| `supabase` | Supabase (ya no se usa activamente) |
| `context7` | Docs actualizadas de librerías |
| `superpowers` | Brainstorming, planes, debugging sistemático |
| `feature-dev` | Explorar codebase + arquitectura |
| `serena` | Navegación semántica del codebase |

---

## 15. Tareas Pendientes — ERP Farmacia

> Módulos priorizados en sesión de brainstorming (Abril 9, 2026).
> Leer `pharmacy-ecommerce/bitacora.md` para el diseño técnico completo de cada fase.

### Fase 1 — Proveedores + Compras 🚧 SIGUIENTE
**Objetivo:** Registrar facturas de proveedores (Mediven, Globalpharma) con foto de cámara → OCR → actualizar stock + costo.

Checklist de implementación:
- [ ] Migración Prisma: tablas `suppliers`, `purchase_orders`, `purchase_order_items`, `supplier_product_mappings` + campo `cost_price` en `products`
- [ ] API CRUD `/api/admin/suppliers`
- [ ] API OCR `/api/admin/purchase-orders/scan` (Google Cloud Vision)
- [ ] API CRUD + receive `/api/admin/purchase-orders`
- [ ] Página `/admin/proveedores` (lista + crear)
- [ ] Página `/admin/compras/nueva` (cámara → OCR → mapeo → confirmar)
- [ ] Página `/admin/compras` (lista) + `/admin/compras/[id]` (detalle)
- [ ] Actualizar `Sidebar.tsx` con nuevos items

### Fase 2 — Punto de Venta (POS) ⏳ pendiente diseño
### Fase 3 — Reportes Financieros (márgenes, costos, PDF/Excel) ⏳ pendiente diseño

### Completado (Abril 8-9, 2026)
- ✅ Vars Supabase eliminadas de Vercel
- ✅ 3 usuarios migrados Supabase → Firebase
- ✅ Reset-password email branded
- ✅ Cron cleanup-orders cada 30min
- ✅ Transbank producción activo (`597053071888`)

---

## 16. Para Retomar Desde Cero

```bash
git clone https://github.com/pabloalvarez99/build-and-deploy-webdev-asap.git
cd build-and-deploy-webdev-asap

# Leer en este orden:
cat context.md                              # este archivo
cat pharmacy-ecommerce/context.md           # contexto técnico detallado
cat pharmacy-ecommerce/bitacora.md          # historial de cambios
cat pharmacy-ecommerce/apps/web/CLAUDE.md   # reglas para Claude Code (si existe)
cat CLAUDE.md                               # reglas globales

# Instalar dependencias
cd pharmacy-ecommerce/apps/web
npm install

# Variables de entorno (pedir .env.local o hacer vercel env pull)
vercel env pull .env.local --environment=development

# Build local (requiere más memoria en esta máquina)
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build

# Deploy → push a main
git push origin main
```

---

*Última actualización: 2026-04-09 — ERP Fase 1 (Proveedores + Compras) en diseño.*
