# Bitácora: Tu Farmacia - E-commerce de Farmacia

## Estado actual: PRODUCCIÓN (Febrero 2026)

**Sitio live**: https://tu-farmacia.vercel.app
**Admin**: https://tu-farmacia.vercel.app/admin
  - admin@pharmacy.com / admin123
  - timadapa@gmail.com / Admin123!

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
