# Contexto de Sesión — Tu Farmacia (actualizado Abril 8, 2026)

> **Este archivo es el punto de entrada para la próxima sesión.**
> Tiene todo lo necesario para retomar sin buscar en bitácora ni historial.

---

## Estado actual: MIGRACIÓN 100% COMPLETA ✅

**Supabase → Firebase Auth + Cloud SQL PostgreSQL 15: DONE.**
- Build Vercel: **PASSING** (commit `ee516c3`)
- App live: https://tu-farmacia.vercel.app
- Admin panel: https://tu-farmacia.vercel.app/admin

---

## Admin

| Campo | Valor |
|---|---|
| Email | `timadapa@gmail.com` |
| Password | `TuFarmacia2026!` |
| Firebase UID | `mUgyCPYUqxZFYjCWexeZSmNMvsS2` |
| Custom claim | `{"role":"admin"}` |

Para cambiar password: https://tu-farmacia.vercel.app/auth/forgot-password

---

## Tareas opcionales pendientes

### 1. 🟡 Configurar Firebase Action URL (branded reset-password)
Actualmente reset-password funciona pero usa la página genérica de Firebase.
Para usar `/auth/reset-password` propio:

**Firebase Console** → Authentication → Templates → Password reset → Customize action URL:
```
https://tu-farmacia.vercel.app/auth/reset-password
```
También agregar `tu-farmacia.vercel.app` a los dominios autorizados en Authentication → Settings → Authorized domains.

### 2. 🟡 Eliminar variables Supabase de Vercel (después de validar producción)
```bash
cd pharmacy-ecommerce/apps/web
vercel env rm NEXT_PUBLIC_SUPABASE_URL production
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env rm SUPABASE_SERVICE_ROLE_KEY production
```

### 3. 🟢 Migrar usuarios registrados de Supabase → Firebase (si aplica)
Si hubiera usuarios registrados en Supabase que necesiten migrar:
- Exportar CSV desde Supabase Dashboard → Authentication → Users → Export
- Ver context anterior para el script de migración

---

## Infraestructura GCP

| Recurso | Valor |
|---|---|
| GCP Project | `tu-farmacia-prod` |
| GCP Account | `timadapa@gmail.com` |
| Cloud SQL Instance | `tu-farmacia-db` |
| Cloud SQL Region | `southamerica-east1-b` |
| Cloud SQL Version | PostgreSQL 15 |
| Cloud SQL IP pública | `34.39.232.207` |
| Cloud SQL Outgoing IP | `35.247.253.253` |
| CLOUD_SQL_INSTANCE (connector) | `tu-farmacia-prod:southamerica-east1:tu-farmacia-db` |
| DB Name | `farmacia` |
| DB User | `farmacia` |
| DB Password | `srcmlaYhkEo19YivrG4FDLH0woou` |
| Firebase Project | `tu-farmacia-prod` |
| Firebase Web App ID | `1:164275006028:web:0bcb105734e84a2f7be2e9` |
| Service Account | `firebase-adminsdk-fbsvc@tu-farmacia-prod.iam.gserviceaccount.com` |
| Service Account JSON | `tu-farmacia-prod-1d6e516dbae2.json` (repo root, gitignored) |
| Service Account Key ID | `1d6e516dbae2eabe5c8d3b6094e89c2917f1ad94` |

---

## Variables de entorno (todas configuradas en Vercel Production + Development)

```bash
# Firebase públicas
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC9k3tw3ckVIim5G9K6lxX1exOb7LdqnRU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-farmacia-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-farmacia-prod

# Firebase Admin (server-side)
FIREBASE_PROJECT_ID=tu-farmacia-prod
FIREBASE_STORAGE_BUCKET=tu-farmacia-prod.firebasestorage.app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@tu-farmacia-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n[...ver .env.local...]\n-----END PRIVATE KEY-----\n

# Cloud SQL
GOOGLE_SERVICE_ACCOUNT=[JSON completo del service account — ver .env.local]
CLOUD_SQL_INSTANCE=tu-farmacia-prod:southamerica-east1:tu-farmacia-db
DB_USER=farmacia
DB_PASSWORD=srcmlaYhkEo19YivrG4FDLH0woou
DB_NAME=farmacia
DATABASE_URL=postgresql://farmacia:srcmlaYhkEo19YivrG4FDLH0woou@34.39.232.207:5432/farmacia

# Vision API
GOOGLE_CLOUD_VISION_API_KEY=AIzaSyBvh-lRmzwPjvCCeyKm3zry2v50JCTeJUs

# Pagos
TRANSBANK_ENVIRONMENT=integration
# TRANSBANK_COMMERCE_CODE= (pendiente credenciales reales)
# TRANSBANK_API_KEY= (pendiente credenciales reales)

# Email
# RESEND_API_KEY= (confirmar si está en Vercel)

# Cron
# CRON_SECRET= (confirmar si está en Vercel)
```

---

## Arquitectura de conexión DB

```
Vercel Function (Node.js)
  └── src/lib/db.ts → getDb()
        └── @google-cloud/cloud-sql-connector
              ├── Auth: GOOGLE_SERVICE_ACCOUNT (JSON) via IAM
              ├── Instance: CLOUD_SQL_INSTANCE
              └── pg.Pool → PrismaPg adapter → PrismaClient

# NO usa DATABASE_URL en runtime — solo para CLI (prisma.config.ts)
# NO necesita allowlist de IPs — usa autenticación IAM del connector
```

---

## Arquitectura de autenticación

```
Browser
  └── Firebase Client SDK (signInWithEmailAndPassword)
        └── POST /api/auth/session { idToken }
              └── adminAuth.createSessionCookie(idToken, 14 días)
                    └── session cookie (httpOnly, secure)
                          └── middleware.ts: decodeJwtPayload (Edge Runtime, sin firebase-admin)
                                └── API routes: adminAuth.verifySessionCookie (Node.js, full verify)
```

Custom claims → `role: 'admin'` en el ID token → session cookie incluye el claim → middleware y API routes lo leen.

---

## Flujo reset-password

1. `/auth/forgot-password` → `sendPasswordResetEmail(auth, email, { url: '/auth/login' })`
2. Firebase envía email → link a `tu-farmacia-prod.firebaseapp.com/__/auth/action`
3. Usuario resetea en página Firebase → redirigido a `/auth/login`
4. (Opcional) Configurar Action URL en Firebase Console para usar `/auth/reset-password` propio

---

## CLIs disponibles locales

| CLI | Path |
|---|---|
| gcloud | `/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud` |
| vercel | `vercel` |
| firebase | `firebase` |

**gcloud no está en PATH de bash** → usar path completo o `export GCLOUD="..."`.

---

## Archivos clave del código

```
src/lib/db.ts                          ← Prisma + Cloud SQL connector
src/lib/firebase/admin.ts              ← Firebase Admin SDK (lazy proxy)
src/lib/firebase/client.ts             ← Firebase browser SDK (browser-only init)
src/lib/firebase/api-helpers.ts        ← getAuthenticatedUser, getAdminUser
src/lib/firebase/middleware.ts         ← JWT decode para middleware routing
src/middleware.ts                      ← Next.js middleware (NO firebase-admin aquí)
src/store/auth.ts                      ← Zustand auth store con Firebase
src/app/api/auth/session/route.ts      ← POST: crea session cookie; DELETE: logout
prisma/schema.prisma                   ← Schema Prisma (sin driverAdapters, ya estable)
prisma.config.ts                       ← Config Prisma 7 (url desde DATABASE_URL)
tu-farmacia-prod-1d6e516dbae2.json    ← Service account key (GITIGNORED, repo root)
```

---

## Reglas críticas (no romper)

1. **firebase-admin NUNCA en middleware.ts** — Edge Runtime no lo soporta.
2. **Firebase client.ts solo inicializa en browser** — `typeof window !== 'undefined'` guard.
3. **getDb() es async** — siempre `await getDb()`.
4. **Build command:** `prisma generate && next build` (ya en package.json scripts.build).
5. **GOOGLE_SERVICE_ACCOUNT** en db.ts se parsea con `JSON.parse()` — debe ser JSON válido como string.
6. **Admin check:** `getAdminUser()` verifica `role === 'admin'` en custom claim del session cookie.
