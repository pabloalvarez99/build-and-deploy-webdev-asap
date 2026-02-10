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
