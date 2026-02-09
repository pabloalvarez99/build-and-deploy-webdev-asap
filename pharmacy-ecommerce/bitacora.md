# Bitácora: Tu Farmacia - E-commerce de Farmacia

## Estado actual: PRODUCCIÓN (Febrero 2026)

**Sitio live**: https://tu-farmacia.vercel.app
**Admin**: https://tu-farmacia.vercel.app/admin (timadapa@gmail.com / Admin123!)

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

---

## Historial de migración

### 2026-02-08: Migración Railway → Supabase (COMPLETADA)

**Antes**: 3 microservicios Rust en Railway + PostgreSQL + Redis
**Después**: Supabase (DB+Auth) + Next.js API routes

Pasos completados:
1. Schema SQL idempotente con RLS, triggers, funciones RPC
2. Supabase clients (browser + server + middleware)
3. Reescritura de `api.ts` (Supabase JS directo), `auth.ts` (Supabase Auth), `cart.ts` (localStorage only)
4. 10 API routes (checkout, webhook, admin CRUD)
5. Actualización de todas las páginas (eliminado parámetro `token` en todas las llamadas)
6. Limpieza de `next.config.js` (eliminados rewrites a Railway)
7. Variables de entorno en Vercel (6 env vars)
8. Deploy producción exitoso
9. Usuario admin creado (timadapa@gmail.com)

### 2026-02-09: Importación de productos (COMPLETADA)

- 1189 productos importados desde Excel
- Mapeo inteligente de categorías (acción terapéutica → categoría, con fallback por departamento)
- Precios parseados de formato CLP ("$3,990") a integer (3990)
- Descripciones profesionales con: acción terapéutica, principio activo, presentación, receta, laboratorio, registro sanitario, bioequivalencia
- Búsqueda automática de imágenes via DuckDuckGo (en proceso)

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
└── src/app/api/                  # 10 API routes

scripts/
├── import_to_supabase.js         # Importar Excel → Supabase
└── update_images_supabase.py     # Buscar imágenes DuckDuckGo

supabase/migrations/
└── 20240101000000_initial_schema.sql  # Schema idempotente
```

## Notas técnicas

- MercadoPago usa `CLP` (pesos chilenos), precios redondeados con `Math.ceil()`
- Webhooks usan idempotency check para evitar double-processing
- Store pickup genera código de 6 dígitos, expira en 48h
- Guest checkout permite comprar sin cuenta (user_id = NULL)
- `vercel link` puede sobrescribir `.env.local` - siempre hacer backup
- Deploy via `git push origin main` (auto-deploy GitHub integration)
