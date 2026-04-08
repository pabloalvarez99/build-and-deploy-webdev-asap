# Contexto de Sesión — Tu Farmacia (actualizado Abril 8, 2026)

> **Este archivo es el punto de entrada para la próxima sesión.**
> Tiene todo lo necesario para retomar sin buscar en bitácora ni historial.

---

## Estado actual: MIGRACIÓN 90% COMPLETA

Migrando de **Supabase → Firebase Auth + Cloud SQL PostgreSQL 15**.
El código está 100% migrado y el build pasa. Solo falta:
1. Migrar datos (pg_dump Supabase → Cloud SQL) ← **NECESITA PASSWORD SUPABASE**
2. Habilitar Firebase Auth Email/Password ← pendiente confirmar
3. Hacer build final + deploy

---

## Lo que QUEDÓ HECHO esta sesión (Abril 8, 2026)

| Tarea | Estado |
|---|---|
| Service account JSON creado y protegido en .gitignore | ✅ |
| FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY → Vercel + .env.local | ✅ |
| Vision API habilitada en GCP | ✅ |
| GOOGLE_CLOUD_VISION_API_KEY → Vercel + .env.local | ✅ |
| Cloud SQL instance `tu-farmacia-db` ya existía y está RUNNABLE | ✅ |
| Billing habilitado en GCP `tu-farmacia-prod` | ✅ |
| Usuario DB `farmacia` creado en Cloud SQL | ✅ |
| Base de datos `farmacia` creada en Cloud SQL | ✅ |
| Service account con roles/cloudsql.client | ✅ |
| GOOGLE_SERVICE_ACCOUNT, CLOUD_SQL_INSTANCE, DB_* → Vercel + .env.local | ✅ |
| prisma/schema.prisma: driverAdapters preview feature agregado | ✅ |
| prisma generate: OK (Prisma 7.7.0) | ✅ |
| @supabase/ssr + @supabase/supabase-js: ELIMINADOS de package.json | ✅ |
| src/lib/supabase/: ELIMINADO | ✅ |

---

## TAREAS PENDIENTES (próxima sesión)

### 1. 🔴 Migrar datos Supabase → Cloud SQL
**BLOQUEADOR: necesita el password de la base de datos Supabase.**

Para obtenerlo: Supabase Dashboard → proyecto `stblntjbcbqylumgngqg` → Settings → Database → Connection string → copiar el password.

Comando una vez que tengas el password:
```bash
# Exportar desde Supabase
pg_dump "postgresql://postgres.stblntjbcbqylumgngqg:[SUPABASE_DB_PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \
  --no-owner --no-acl --schema=public \
  -f /tmp/supabase_dump.sql

# Autorizar IP local en Cloud SQL para importar
GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
MY_IP=$(curl -s https://api.ipify.org)
"$GCLOUD" sql instances patch tu-farmacia-db \
  --authorized-networks="$MY_IP/32" \
  --project=tu-farmacia-prod

# Importar a Cloud SQL
PGPASSWORD="srcmlaYhkEo19YivrG4FDLH0woou" psql \
  -h 34.39.232.207 -U farmacia -d farmacia \
  -f /tmp/supabase_dump.sql

# Ejecutar tablas extra (si pg_dump no las incluyó)
PGPASSWORD="srcmlaYhkEo19YivrG4FDLH0woou" psql \
  -h 34.39.232.207 -U farmacia -d farmacia \
  -f pharmacy-ecommerce/database/cloud-sql-extra-tables.sql

# Remover autorización IP (seguridad)
"$GCLOUD" sql instances patch tu-farmacia-db \
  --clear-authorized-networks \
  --project=tu-farmacia-prod
```

### 2. 🟡 Habilitar Firebase Auth Email/Password
Intentado via REST API pero la respuesta fue `{}` — puede estar ya habilitado o requiere confirmación.

**Verificar / habilitar:**
```bash
GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
TOKEN=$("$GCLOUD" auth print-access-token)
# Verificar estado actual:
curl -s "https://identitytoolkit.googleapis.com/admin/v2/projects/tu-farmacia-prod/config" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool

# Si email.enabled no aparece como true, habilitar:
curl -s -X PATCH \
  "https://identitytoolkit.googleapis.com/admin/v2/projects/tu-farmacia-prod/config?updateMask=signIn" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"signIn":{"email":{"enabled":true,"passwordRequired":true}}}'
```

O manualmente: console.firebase.google.com → tu-farmacia-prod → Authentication → Sign-in method → Email/Password → Habilitar.

### 3. 🟡 Migrar usuarios Supabase → Firebase Auth
Una vez que tengas el CSV de usuarios de Supabase:
```bash
cd pharmacy-ecommerce/apps/web
# Con CSV de Supabase (Authentication → Users → Export)
npx ts-node scripts/migrate-users.ts --csv /ruta/al/users.csv

# Setear admin (reemplazar con email real del admin)
npx ts-node scripts/migrate-users.ts --set-admin timadapa@gmail.com
```

### 4. 🟢 Build + Deploy
```bash
cd pharmacy-ecommerce/apps/web
NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build

# Si build OK:
git add -A && git commit -m "feat: migración completa a Firebase Auth + Cloud SQL"
git push origin main  # → auto-deploy en Vercel
```

### 5. 🟡 Limpiar variables Supabase en Vercel (después de validar que todo funciona)
```bash
cd pharmacy-ecommerce/apps/web
vercel env rm NEXT_PUBLIC_SUPABASE_URL production
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env rm SUPABASE_SERVICE_ROLE_KEY production
# Repetir para development
```

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

## Supabase (origen de la migración)

| Recurso | Valor |
|---|---|
| Project ref | `stblntjbcbqylumgngqg` |
| URL | `https://stblntjbcbqylumgngqg.supabase.co` |
| DB password | **Necesitas obtenerlo del dashboard** → Settings → Database |
| Pooler host (pg_dump) | `aws-0-sa-east-1.pooler.supabase.com` |
| Pooler user | `postgres.stblntjbcbqylumgngqg` |
| Pooler port | `5432` |

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

## Arquitectura de conexión DB (cómo funciona)

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

## CLIs disponibles locales

| CLI | Versión | Path |
|---|---|---|
| gcloud | 564.0.0 | `/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud` |
| vercel | 50.37.0 | `vercel` |
| firebase | 15.11.0 | `firebase` |
| node | — | — |

**gcloud no está en PATH de bash** — usar path completo o configurar:
```bash
export GCLOUD="/c/Program Files (x86)/Google/Cloud SDK/google-cloud-sdk/bin/gcloud"
```

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
prisma/schema.prisma                   ← Schema Prisma (driverAdapters habilitado)
prisma.config.ts                       ← Config Prisma 7 (url desde DATABASE_URL)
scripts/migrate-users.ts               ← One-time: migrar users Supabase → Firebase
database/cloud-sql-extra-tables.sql    ← SQL tablas extra si no vienen del pg_dump
tu-farmacia-prod-1d6e516dbae2.json    ← Service account key (GITIGNORED, repo root)
```

---

## Reglas críticas (no romper)

1. **firebase-admin NUNCA en middleware.ts** — Edge Runtime no lo soporta. Solo en API routes o Server Components con `runtime = 'nodejs'`.
2. **Firebase client.ts solo inicializa en browser** — `typeof window !== 'undefined'` guard para evitar crashes en SSR prerender.
3. **getDb() es async** — siempre `await getDb()` antes de usar Prisma.
4. **Build command:** `NODE_OPTIONS=--max-old-space-size=6144 ./node_modules/.bin/next build` (NUNCA `npx next build` — trae Next.js 16).
5. **GOOGLE_SERVICE_ACCOUNT** en db.ts se parsea con `JSON.parse()` — debe ser JSON válido como string.
