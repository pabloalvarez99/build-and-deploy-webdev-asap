# Bitácora: Tu Farmacia - E-commerce de Farmacia

## Estado actual: MIGRACIÓN COMPLETA ✅ — Firebase Auth + Cloud SQL activo (Abril 8, 2026)

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
