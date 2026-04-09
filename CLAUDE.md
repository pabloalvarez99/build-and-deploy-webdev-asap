# Tu Farmacia - Project Context

## Overview
E-commerce de farmacia para adultos mayores en Coquimbo, Chile.
- **Live**: https://tu-farmacia.vercel.app
- **Admin**: https://tu-farmacia.vercel.app/admin
- **Repo root**: Este directorio
- **Web app**: `pharmacy-ecommerce/apps/web`

## Stack
- Next.js 14.2.35 + Tailwind CSS 3 + TypeScript
- Supabase (PostgreSQL + Auth + RLS) - project `jvagvjwrjiekaafpjbit`
- Transbank Webpay Plus (`transbank-sdk`) para pagos online con tarjeta
- Resend para emails transaccionales
- Zustand (cart en localStorage, auth con Supabase)
- Recharts para graficos en el dashboard admin
- Vercel (deploy automatico via `git push origin main`)

## Build & Deploy
- **IMPORTANTE**: Usar `./node_modules/.bin/next build` desde `apps/web/`, NUNCA `npx next build` (npx trae Next.js 16 del cache)
- **Memoria**: `NODE_OPTIONS=--max-old-space-size=6144` requerido en esta máquina para evitar OOM durante build
- **Bash paths**: Usar Unix `/c/Users/Admin/...` no Windows `C:\Users\Admin\...`
- **Vercel root dir**: `pharmacy-ecommerce/apps/web`
- **Deploy**: `git push origin main` → auto-deploy en Vercel

## Database (Supabase)
- 1189 productos, 17 categorias
- RLS habilitado en todas las tablas
- Tablas: products, categories, orders, order_items, profiles, therapeutic_category_mapping, admin_settings
- Campos producto: name, slug, price, stock, category_id, image_url, laboratory, therapeutic_action, active_ingredient, prescription_type, presentation, discount_percent
- Ordenes guest: user_id = NULL, usan guest_email, guest_name, guest_surname, customer_phone
- Ordenes de usuarios autenticados: user_id = auth.uid(), aparecen en /mis-pedidos
- Store pickup: status='reserved', pickup_code (6 digitos), reservation_expires_at (24h)
- Stock: se descuenta con RPC `decrement_stock(p_product_id, p_quantity)` al aprobar retiro o completar Webpay
- admin_settings: tabla con key/value para alert_email y low_stock_threshold (default 10)

## Arquitectura de paginas
```
/ (homepage)                  → Grid categorias + productos + busqueda + "cargar mas"
/producto/[slug]              → Detalle producto + agregar al carrito
/carrito                      → Carrito (localStorage) + control de stock
/checkout                     → Formulario + metodo pago (Webpay Plus o retiro tienda)
/checkout/webpay/success      → Confirmacion Webpay Plus
/checkout/webpay/error        → Error/cancelacion Webpay
/checkout/reservation         → Codigo retiro tienda
/auth/login                   → Inicio de sesion (preserva ?redirect=)
/auth/register                → Registro (preserva ?redirect=, Suspense boundary)
/auth/forgot-password         → Recuperar contraseña (envia email)
/auth/reset-password          → Nueva contraseña (desde link de email)
/mis-pedidos                  → Ordenes del usuario (requiere auth)
/mis-pedidos/[id]             → Detalle de orden + timeline de estado
/admin/*                      → Panel admin (requiere rol admin)
```

## API Routes
```
POST     /api/webpay/create                        → Crea orden pending + transaccion Transbank
GET|POST /api/webpay/return                        → Callback de Transbank, commit, actualiza a paid
POST     /api/store-pickup                         → Crea orden reserved con pickup_code (24h expiry)
GET      /api/cron/cleanup-orders                  → Cancela ordenes expiradas (cron cada 30min, requiere CRON_SECRET)
GET      /api/admin/orders                         → Lista ordenes (service role, ve todas)
PUT      /api/admin/orders/[id]                    → Actualiza estado orden + restaura stock si cancela
PUT      /api/admin/orders/[id] {action:approve}   → Aprueba retiro: descuenta stock, envia email, alerta stock bajo
PUT      /api/admin/orders/[id] {action:reject}    → Rechaza retiro: cancela orden, envia email
GET      /api/admin/reportes                       → KPIs, ventas por dia, top productos, por categoria
CRUD     /api/admin/products                       → Admin productos (con import Excel)
CRUD     /api/admin/categories                     → Admin categorias
GET|PATCH /api/admin/settings                      → Configuracion (email alertas, umbral stock)
GET      /api/admin/clientes                       → Lista clientes registrados + guests
GET|PUT|DELETE /api/admin/clientes/[id]            → Detalle, editar o eliminar cliente registrado
GET      /api/admin/clientes/guest?email=xxx       → Detalle + historial cliente guest
POST     /api/auth/register                        → Registro via service role (auto-confirma email)
```

## Gotchas conocidos
- Supabase `.eq('tabla_join.campo', valor)` NO funciona como inner join. Siempre buscar el ID primero y filtrar por FK directo.
- `orderApi.list()` filtra por user_id (usuario). `orderApi.listAll()` usa service role (admin, ve guest orders).
- Webpay buyOrder max 26 chars: UUID sin guiones truncado a 26 chars.
- CLP no tiene decimales: usar `Math.round()` al pasar montos a Transbank.
- Las imagenes pueden tener `http://` — `sanitizeImageUrl()` en api.ts convierte a `https://`.
- `getAuthenticatedUser()` en api-helpers.ts lee sesion desde cookies (server-side). Usar en API routes para asociar user_id.
- `isPickup` siempre usar `payment_provider === 'store'`, NO `!!order.pickup_code`.
- `fetch` no lanza error en 4xx/5xx — siempre chequear `res.ok` antes de mostrar exito.
- Cart items tienen campo `stock: number` — el boton "+" esta deshabilitado si `quantity >= stock`.
- `fetchCart` en cart.ts capea quantity a `Math.min(item.quantity, product.stock)` y sincroniza localStorage.

## Diseño y UI
- Mobile-first para adultos mayores
- Font base 18px, touch targets 48px+, alto contraste
- Colores: emerald-600 primario, slate para texto
- Cards: rounded-2xl, border-2
- Sin filtros complejos: solo categorias (grid) + busqueda
- Dark mode: soportado en todas las paginas con clases `dark:*`
- Admin mobile: barra de navegacion inferior fija (bottom nav) con los 7 items, badges con contadores
- Admin desktop: sidebar lateral colapsable (64px / 256px)
- overflow-x: hidden en html y body para evitar scroll horizontal en movil

## Variables de entorno requeridas (Vercel + .env.local)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TRANSBANK_ENVIRONMENT=integration   # cambiar a 'production' cuando lleguen credenciales
TRANSBANK_COMMERCE_CODE
TRANSBANK_API_KEY
RESEND_API_KEY
CRON_SECRET                         # generar con: openssl rand -hex 32
```

## Bitacora
Despues de cada cambio significativo, actualizar `pharmacy-ecommerce/bitacora.md` con los cambios realizados.


## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Obsidian Mind Vault (PKM)

Vault instalado en `C:\Users\Admin\Documents\obsidian-mind`. Es el cerebro externo del proyecto — todo conocimiento durable vive ahí, no en `~/.claude/memory/`.

### Mapeo Tu Farmacia → Vault

| Qué guardar | Dónde en el vault |
|---|---|
| Patrones y gotchas del codebase | `brain/Patterns.md`, `brain/Gotchas.md` |
| Decisiones arquitectónicas | `brain/Key Decisions.md` + `work/active/` |
| Fases ERP activas | `work/active/ERP Fase 1 - Proveedores.md` |
| Contexto de stack y arquitectura | `reference/Tu Farmacia Architecture.md` |
| Decisiones completadas | `work/archive/YYYY/` |
| Objetivos del producto | `brain/North Star.md` |

### Sistema de Memoria

Cuando el usuario pida "recuerda X":
1. Escribir en el topic note relevante de `brain/` (Gotchas, Patterns, Key Decisions)
2. Actualizar `brain/Memories.md` si se crea un topic note nuevo
3. NO crear archivos adicionales en `~/.claude/projects/.../memory/` — solo `MEMORY.md` es el índice

### Comandos Relevantes (desde el vault)

| Comando | Uso |
|---|---|
| `/om-standup` | Kickoff de sesión — carga contexto, revisa trabajo activo |
| `/om-wrap-up` | Cierre de sesión — archiva, actualiza índices, captura learnings |
| `/om-dump` | Captura rápida de cualquier cosa → se enruta al lugar correcto |
| `/om-intake` | Procesa notas de reunión → las clasifica y enruta |

### Reglas

- Conocimiento durable (gotchas, decisiones, patrones) → vault `brain/`, no en memoria efímera
- Fases ERP → `work/active/` mientras están en progreso, `work/archive/YYYY/` al completar
- Arquitectura y stack docs → `reference/`
- Al terminar una sesión significativa, actualizar `brain/Gotchas.md` con gotchas nuevos encontrados
