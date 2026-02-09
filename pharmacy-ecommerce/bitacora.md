# Bitácora: Tu Farmacia - E-commerce de Farmacia

## Estado actual: PRODUCCIÓN (Febrero 2026)

**Sitio live**: https://tu-farmacia.vercel.app
**Admin**: https://tu-farmacia.vercel.app/admin
  - admin@pharmacy.com / admin123
  - timadapa@gmail.com / Admin123!

---

## TAREA EN PROGRESO: Sistema de Filtros + Descripciones (Febrero 2026)

### Problema
1. **Filtros primitivos**: Solo un dropdown de categorías. La API ya soporta filtrar por laboratorio, tipo receta, rango precio, principio activo - pero el UI no los expone.
2. **Descripciones inútiles**: Dump mecánico de metadata en texto plano ("Acción terapéutica: X. Principio activo: Y. Laboratorio: Z...") que repite info ya visible en otros campos.

### Objetivo
Transformar a nivel farmacia profesional (Cruz Verde, Ahumada): sidebar de filtros en desktop, drawer en mobile, pills de categorías, badges en producto, tabla info estructurada.

### Estado de las tareas

#### COMPLETADO - Componentes de filtros creados:
Los 5 componentes de filtros ya están escritos y listos:
- `src/components/filters/FilterContent.tsx` - UI compartido de filtros (tipo venta, categorías, laboratorio buscable, rango precio, disponibilidad)
- `src/components/filters/FilterSidebar.tsx` - Wrapper desktop: sidebar sticky w-64 a la izquierda
- `src/components/filters/FilterDrawer.tsx` - Wrapper mobile: drawer overlay desde abajo con backdrop
- `src/components/filters/CategoryPills.tsx` - Fila horizontal scrollable de pills de categorías
- `src/components/filters/ActiveFilters.tsx` - Chips removibles de filtros activos con "Limpiar todos"

#### COMPLETADO - Homepage refactoreada (`src/app/page.tsx`):
El homepage ya fue reescrito con:
- Layout sidebar (desktop lg+) + contenido a la derecha
- CategoryPills arriba del grid
- ActiveFilters chips debajo de pills
- Botón "Filtros (N)" en mobile que abre FilterDrawer
- Todos los filtros conectados a la API: category, laboratory, prescription_type, min_price, max_price, in_stock
- `loadLaboratories()` carga labs al inicio via `productApi.getLaboratories()`
- Estado de filtros con `useState` + `useMemo` para conteo y lista de filtros activos
- Se eliminó el dropdown de categoría viejo (mal etiquetado "Todos los laboratorios")
- Se eliminó el botón "Disponibles" del controls bar (movido al sidebar)
- Grid view ajustado a lg:grid-cols-4 (era 5, ahora hay sidebar)

#### COMPLETADO - CSS actualizado (`src/app/globals.css`):
- Agregado `.scrollbar-hide` utility para pills horizontales
- Agregados `@keyframes slideUp` y `fadeIn` para animación del drawer mobile

#### COMPLETADO - Página de producto (`src/app/producto/[slug]/page.tsx`):
Rediseñada con:

1. **Badges row** (entre nombre y precio):
   - Tipo receta: verde (Venta Directa), amarillo (Receta Médica), rojo (Receta Retenida)
   - Bioequivalente: badge azul (detección regex en description)
   - Categoría: badge slate clickeable → navega a `/?category=<slug>`

2. **Tabla de información estructurada** (entre precio y envío/seguridad):
   - Filas condicionales: Principio Activo, Presentación, Acción Terapéutica
   - NO repite laboratorio (ya arriba), NO muestra registro sanitario/control legal

3. **Eliminado** el bloque `prose prose-sm` que mostraba description como texto raw

#### COMPLETADO - Build verificado:
- `next build` exitoso sin errores de TypeScript ni compilación
- 24 páginas generadas correctamente

#### PENDIENTE - Deploy:
1. `git add` los archivos modificados y nuevos
2. `git commit` y `git push origin main` para auto-deploy en Vercel
3. Verificar en https://tu-farmacia.vercel.app que filtros y página de producto funcionan

### Archivos modificados (sin commitear):
```
MODIFICADOS:
  pharmacy-ecommerce/apps/web/src/app/globals.css     # scrollbar-hide + keyframes
  pharmacy-ecommerce/apps/web/src/app/page.tsx         # refactor completo con filtros

NUEVOS:
  pharmacy-ecommerce/apps/web/src/components/filters/FilterContent.tsx
  pharmacy-ecommerce/apps/web/src/components/filters/FilterSidebar.tsx
  pharmacy-ecommerce/apps/web/src/components/filters/FilterDrawer.tsx
  pharmacy-ecommerce/apps/web/src/components/filters/CategoryPills.tsx
  pharmacy-ecommerce/apps/web/src/components/filters/ActiveFilters.tsx

MODIFICADO:
  pharmacy-ecommerce/apps/web/src/app/producto/[slug]/page.tsx  # badges + tabla info (COMPLETADO)
```

### API ya disponible (NO necesita cambios):
```typescript
// Filtros en productApi.list():
category, laboratory, prescription_type, min_price, max_price, in_stock, search

// RPCs para opciones de filtros:
productApi.getLaboratories()        // string[]
productApi.getTherapeuticActions()  // string[]
productApi.getActiveIngredients()   // string[]
productApi.listCategories()         // Category[]
```

### Referencia del plan completo:
Ver `.claude/plans/shimmering-wishing-pearl.md` para el plan detallado con diseño de cada componente.

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
- Descripciones generadas con: acción terapéutica, principio activo, presentación, receta, laboratorio, registro sanitario, bioequivalencia
- Búsqueda automática de imágenes via DuckDuckGo: **1075/1188 (90.5%)** en 107 minutos
- Corrección masiva http→https: 24+55=79 URLs corregidas en DB

### 2026-02-08: Corrección errores checkout y Mixed Content (COMPLETADA)

**Errores detectados en producción:**
1. Mixed Content: 24 productos tenían image_url con `http://` en vez de `https://`
2. MercadoPago back_urls error: `NEXT_PUBLIC_SITE_URL` no estaba configurado correctamente
3. guest-checkout 500: causado por error #2
4. Algunas imágenes con ERR_NAME_NOT_RESOLVED (dominios caídos)

**Correcciones aplicadas:**
1. **NEXT_PUBLIC_SITE_URL**: Re-configurado en Vercel producción como `https://tu-farmacia.vercel.app`
2. **Mixed Content DB**: Actualización SQL de 24 productos `http://` → `https://` en Supabase
3. **Mixed Content código**: `sanitizeImageUrl()` en `api.ts` convierte automáticamente `http://` → `https://`
4. **Script imágenes**: `update_images_supabase.py` ahora convierte URLs a `https://` antes de guardar
5. **guest-checkout**: Ahora guarda `guest_name` y `guest_surname` en la orden
6. **URL robusta**: `siteUrl` en checkout/guest-checkout hace `.trim().replace(/\/+$/, '')` para evitar trailing slashes
7. **Errores usuario**: Checkout muestra mensajes amigables en vez de JSON raw de MercadoPago
8. **Logging**: console.error en guest-checkout para debug de errores MercadoPago

---

## Archivos clave

```
apps/web/
├── src/lib/supabase/client.ts    # Cliente browser (anon key)
├── src/lib/supabase/server.ts    # Cliente server (service role)
├── src/lib/api.ts                # API de productos/órdenes (tiene TODOS los filtros)
├── src/store/auth.ts             # Zustand auth (Supabase Auth)
├── src/store/cart.ts             # Zustand cart (localStorage)
├── src/middleware.ts              # Auth session refresh
├── src/app/api/                  # 10 API routes
├── src/app/page.tsx              # Homepage con filtros (REFACTOREADO)
├── src/app/producto/[slug]/page.tsx  # Detalle producto (PENDIENTE rediseño)
└── src/components/filters/       # 5 componentes de filtros (NUEVOS)

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
- Root dir en Vercel: `pharmacy-ecommerce/apps/web`
