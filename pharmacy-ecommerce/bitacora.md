# Bitácora: Tu Farmacia - E-commerce de Farmacia

## Estado actual: PRODUCCIÓN (Febrero 2026)

**Sitio live**: https://tu-farmacia.vercel.app
**Admin**: https://tu-farmacia.vercel.app/admin
  - admin@pharmacy.com / admin123
  - timadapa@gmail.com / Admin123!

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
