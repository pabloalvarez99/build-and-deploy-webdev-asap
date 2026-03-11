# Tu Farmacia - Project Context

## Overview
E-commerce de farmacia para adultos mayores en Coquimbo, Chile.
- **Live**: https://tu-farmacia.vercel.app
- **Admin**: https://tu-farmacia.vercel.app/admin
- **Repo root**: Este directorio
- **Web app**: `pharmacy-ecommerce/apps/web`

## Stack
- Next.js 14.1.0 + Tailwind CSS + TypeScript
- Supabase (PostgreSQL + Auth + RLS) - project `jvagvjwrjiekaafpjbit`
- MercadoPago (pagos CLP - pesos chilenos)
- Zustand (cart en localStorage, auth con Supabase)
- Vercel (deploy automatico via `git push origin main`)

## Build & Deploy
- **IMPORTANTE**: Usar `./node_modules/.bin/next build` desde `apps/web/`, NUNCA `npx next build` (npx trae Next.js 16 del cache, el proyecto usa 14.1.0)
- **Bash paths**: Usar Unix `/c/Users/Pablo/...` no Windows `C:\Users\Pablo\...`
- **Vercel root dir**: `pharmacy-ecommerce/apps/web`
- **Deploy**: `git push origin main` → auto-deploy en Vercel

## Database (Supabase)
- 1189 productos, 17 categorias
- RLS habilitado en todas las tablas
- Tablas: products, categories, orders, order_items, profiles, therapeutic_category_mapping
- Campos producto: name, slug, price, stock, category_id, image_url, laboratory, therapeutic_action, active_ingredient, prescription_type, presentation
- Ordenes guest: user_id = NULL, usan guest_email, guest_name, guest_surname
- Store pickup: status='reserved', pickup_code (6 digitos), reservation_expires_at (48h)

## Arquitectura de paginas
```
/ (homepage)          → Grid categorias + productos + busqueda + "cargar mas"
/producto/[slug]      → Detalle producto + agregar al carrito
/carrito              → Carrito (localStorage)
/checkout             → Formulario + metodo pago (MercadoPago o retiro tienda)
/checkout/success     → Confirmacion MercadoPago
/checkout/failure     → Error MercadoPago
/checkout/pending     → Pago pendiente
/checkout/reservation → Codigo retiro tienda
/mis-pedidos          → Ordenes del usuario (requiere auth)
/admin/*              → Panel admin (requiere rol admin)
```

## API Routes
```
POST /api/guest-checkout    → Crea orden + preferencia MercadoPago
POST /api/store-pickup      → Crea orden con pickup_code
POST /api/webhook/mercadopago → Webhook de pago
GET  /api/admin/orders      → Lista ordenes (service role, ve todas)
PUT  /api/admin/orders/[id] → Actualiza estado orden
CRUD /api/admin/products    → Admin productos
CRUD /api/admin/categories  → Admin categorias
```

## Gotchas conocidos
- Supabase `.eq('tabla_join.campo', valor)` NO funciona como inner join. Siempre buscar el ID primero y filtrar por FK directo.
- `orderApi.list()` filtra por user_id (usuario). `orderApi.listAll()` usa service role (admin, ve guest orders).
- MercadoPago usa `Math.ceil(price)` porque CLP no tiene decimales.
- Las imagenes pueden tener `http://` - `sanitizeImageUrl()` en api.ts convierte a `https://`.

## Principios de diseno
- Mobile-first para adultos mayores
- Font base 18px, touch targets 48px+, alto contraste
- Colores: emerald-600 primario, slate para texto
- Cards: rounded-2xl, border-2
- Sin filtros complejos: solo categorias (grid) + busqueda

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
