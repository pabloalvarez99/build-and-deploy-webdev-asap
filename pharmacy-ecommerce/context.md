# Contexto de Sesión — Tu Farmacia (actualizado Abril 13, 2026)

> **Este archivo es el punto de entrada para la próxima sesión.**
> Tiene todo lo necesario para retomar sin buscar en bitácora ni historial.

---

## Estado actual: ERP COMPLETO ✅ — Barcodes POS + Electron build + Emails Webpay

**Último commit:** `5e849d0` — feat: ícono Tu Farmacia para Electron desktop app
**App live:** https://tu-farmacia.cl (también https://tu-farmacia.vercel.app)
**Admin panel:** https://tu-farmacia.cl/admin

---

## Admin

| Campo | Valor |
|---|---|
| Email | `timadapa@gmail.com` |
| Password | `TuFarmacia2026!` |
| Firebase UID | `mUgyCPYUqxZFYjCWexeZSmNMvsS2` |
| Custom claim | `{"role":"admin"}` |

---

## Qué se completó hoy (Abril 10, 2026)

### Features
- **Banners puntos ganados** en páginas de éxito:
  - Webpay success: "¡Ganaste X puntos!" (puntos ya acreditados)
  - Reserva tienda: "Ganarás X puntos al retirar" (se acreditan al aprobar admin)
  - Solo visibles para usuarios registrados (`useAuthStore`)
- **Canjeo de puntos en checkout** (solo retiro en tienda):
  - Tasa: 1 punto = $100 CLP descuento (10% de retorno sobre $1000 = 1 punto)
  - UI: toggle en resumen del pedido, total tachado + total efectivo
  - Backend: deducción atómica con la orden en misma transacción Prisma
  - Restauración automática al cancelar (admin PUT) o expirar (cron)
  - Nuevas funciones en `loyalty.ts`: `redeemLoyaltyPoints`, `restoreLoyaltyPoints`, `POINTS_TO_CLP`
- **POS en Electron** (apps/desktop/):
  - `main.js`: carga `https://tu-farmacia.vercel.app` (URL corregida)
  - Barcode scanner HID con detección por timing
  - Error visible en POS si falla búsqueda (antes era silent catch)

### Bug fixes
- **Admin order detail "Orden no encontrada"**: `orderApi.get()` filtraba por `user_id = admin.uid`. Fix: nuevo `GET /api/admin/orders/[id]` sin filtro de user, `orderApi.adminGet(id)` en `api.ts`.
- **POS sin productos en Electron**: `APP_URL = 'https://tu-farmacia.cl'` no existía en Vercel → fetch silenciosamente fallaba. Fix: URL corregida a `tu-farmacia.vercel.app`.

---

## Completado Abril 13, 2026

- ✅ **Import Excel**: fix timeout (batches paralelos), fix `stock_movements_reason_check`, fix "Too many connections" (max_connections 60)
- ✅ **Códigos de barra POS**: tabla `product_barcodes` + `barcode_catalog` (3,160 barcodes del CSV). Sync automático al final de cada import Excel. API `?barcode=<EAN>` busca en product_barcodes primero.
- ✅ **Email Webpay usuarios registrados**: antes solo se enviaba a guests. Ahora busca email en Firebase Admin si hay `user_id`.
- ✅ **Electron icon + build**: cruz farmacéutica verde (emerald-600), ICO multi-resolución. `Tu-Farmacia-Portable.exe` + `Tu-Farmacia-Setup.exe` (71MB) en `apps/desktop/dist/`.
- ✅ **Firebase Action URL**: `https://tu-farmacia.cl/auth/reset-password` configurado en Firebase Console.
- ✅ **CLAUDE.md actualizado**: eliminadas todas las referencias a Supabase. Refleja stack real (Firebase Auth + Cloud SQL).

## Tareas pendientes (próxima sesión)

> No hay tareas críticas pendientes. El sistema está completo y en producción.

---

## MCP Plugins Claude Code

| Plugin | Estado | Notas |
|---|---|---|
| `github@claude-plugins-official` | ✅ Activo | Token en `GITHUB_PERSONAL_ACCESS_TOKEN` (Windows setx). Si falla: PAT con `repo`, `read:org`, `copilot`. |
| `goodmem@claude-plugins-official` | ✅ Activo | Requirió build manual: `npm install && npm run build` en `~/.claude/plugins/cache/.../goodmem/0.1.0/mcp/`. Si falla al reconectar, re-correr. |

---

## Infraestructura GCP

| Recurso | Valor |
|---|---|
| GCP Project | `tu-farmacia-prod` |
| GCP Account | `timadapa@gmail.com` |
| Cloud SQL Instance | `tu-farmacia-db` |
| Cloud SQL Region | `southamerica-east1-b` |
| Cloud SQL IP pública | `34.39.232.207` |
| CLOUD_SQL_INSTANCE | `tu-farmacia-prod:southamerica-east1:tu-farmacia-db` |
| DB Name | `farmacia` |
| DB User | `farmacia` |
| DB Password | `srcmlaYhkEo19YivrG4FDLH0woou` |
| Firebase Project | `tu-farmacia-prod` |

---

## Variables de entorno (Vercel Production + Development)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC9k3tw3ckVIim5G9K6lxX1exOb7LdqnRU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-farmacia-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-farmacia-prod
FIREBASE_PROJECT_ID=tu-farmacia-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@tu-farmacia-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n[...ver .env.local...]\n-----END PRIVATE KEY-----\n
GOOGLE_SERVICE_ACCOUNT=[JSON completo — ver .env.local]
CLOUD_SQL_INSTANCE=tu-farmacia-prod:southamerica-east1:tu-farmacia-db
DB_USER=farmacia
DB_PASSWORD=srcmlaYhkEo19YivrG4FDLH0woou
DB_NAME=farmacia
DATABASE_URL=postgresql://farmacia:srcmlaYhkEo19YivrG4FDLH0woou@34.39.232.207:5432/farmacia
GOOGLE_CLOUD_VISION_API_KEY=AIzaSyBvh-lRmzwPjvCCeyKm3zry2v50JCTeJUs
TRANSBANK_ENVIRONMENT=production
TRANSBANK_COMMERCE_CODE=597053071888
# RESEND_API_KEY= (configurado en Vercel)
# CRON_SECRET= (configurado en Vercel)
```

---

## Arquitectura de conexión DB

```
Vercel Function (Node.js)
  └── src/lib/db.ts → getDb()
        └── @google-cloud/cloud-sql-connector
              ├── Auth: GOOGLE_SERVICE_ACCOUNT (JSON) via IAM
              └── pg.Pool → PrismaPg adapter → PrismaClient
# NO usa DATABASE_URL en runtime — solo para CLI (prisma.config.ts)
```

## Arquitectura de autenticación

```
Browser → Firebase Client SDK → POST /api/auth/session { idToken }
  → adminAuth.createSessionCookie(idToken, 14 días)
    → session cookie (httpOnly, secure)
      → middleware.ts: decodeJwtPayload (Edge Runtime, sin firebase-admin)
        → API routes: adminAuth.verifySessionCookie (Node.js)
```

---

## Sistema de fidelización (implementado)

| Concepto | Valor |
|---|---|
| Ganancia | 1 punto por cada $1.000 CLP gastados |
| Canje | 1 punto = $100 CLP de descuento |
| Retorno | 10% |
| Solo canjeable en | Retiro en tienda (Webpay tiene riesgo de reversión) |
| Restauración | Al cancelar (admin) o expirar reserva (cron) |
| Tabla | `loyalty_transactions` (points negativos = canje) |

---

## Archivos clave del código

```
src/lib/db.ts                          ← Prisma + Cloud SQL connector
src/lib/firebase/admin.ts              ← Firebase Admin SDK
src/lib/firebase/client.ts             ← Firebase browser SDK
src/lib/firebase/api-helpers.ts        ← getAuthenticatedUser, getAdminUser
src/lib/loyalty.ts                     ← awardLoyaltyPoints, redeemLoyaltyPoints, restoreLoyaltyPoints
src/lib/loyalty-utils.ts               ← calcPoints, POINTS_TO_CLP (safe para Client Components)
src/middleware.ts                      ← Next.js middleware (NO firebase-admin)
src/store/auth.ts                      ← Zustand auth store con Firebase
src/app/api/auth/session/route.ts      ← POST: crea session cookie; DELETE: logout
src/app/api/loyalty/route.ts           ← GET: puntos del usuario autenticado
src/app/api/admin/orders/[id]/route.ts ← GET (admin, sin filtro user) + PUT (update/acciones)
src/app/admin/pos/page.tsx             ← POS con barcode scanner HID
pharmacy-ecommerce/apps/desktop/       ← App Electron (main.js, preload.js)
prisma/schema.prisma                   ← Schema Prisma
```

---

## Reglas críticas (no romper)

1. **firebase-admin NUNCA en middleware.ts** — Edge Runtime no lo soporta.
2. **Firebase client.ts solo inicializa en browser** — `typeof window !== 'undefined'` guard.
3. **getDb() es async** — siempre `await getDb()`.
4. **Build command:** `prisma generate && next build` (en package.json).
5. **Admin orders**: usar `orderApi.adminGet(id)` (→ `/api/admin/orders/[id]`), nunca `orderApi.get(id)` (→ filtra por user_id).
6. **Electron APP_URL**: siempre `https://tu-farmacia.vercel.app`, no dominios .cl u otros.
7. **Build local**: `NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build` desde `apps/web/`.
8. **Catch silente en POS/búsquedas**: siempre mostrar el error, nunca `catch {}` vacío en UI.
