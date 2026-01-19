# Contexto del Proyecto - Tu Farmacia E-commerce

## Resumen Ejecutivo

E-commerce de farmacia chilena con catálogo de +1000 medicamentos, carrito de compras, checkout con Stripe, y panel de administración profesional.

**URLs en Producción:**
- Frontend: https://pharmacy-ecommerce-tau.vercel.app
- Backend: https://pharmacy-ecommerce-production-5765.up.railway.app

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Estado | Zustand |
| Gráficos | Recharts |
| Backend | NestJS, TypeORM, PostgreSQL |
| Pagos | Stripe |
| Hosting Frontend | Vercel |
| Hosting Backend | Railway |
| Base de Datos | PostgreSQL (Railway) |

---

## Estructura del Proyecto

```
pharmacy-ecommerce/
├── apps/
│   ├── web/                    # Frontend Next.js
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   │   ├── page.tsx    # Catálogo principal
│   │   │   │   ├── checkout/   # Proceso de pago
│   │   │   │   ├── admin/      # Panel de administración
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── page.tsx        # Dashboard
│   │   │   │   │   ├── productos/
│   │   │   │   │   ├── ordenes/
│   │   │   │   │   └── categorias/
│   │   │   ├── components/
│   │   │   │   ├── admin/      # Componentes admin
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── CommandPalette.tsx
│   │   │   │   │   ├── NotificationBell.tsx
│   │   │   │   │   └── Breadcrumbs.tsx
│   │   │   │   └── ...
│   │   │   ├── lib/
│   │   │   │   └── api.ts      # Cliente API
│   │   │   ├── store/
│   │   │   │   ├── auth.ts     # Estado autenticación
│   │   │   │   └── cart.ts     # Estado carrito
│   │   │   └── hooks/
│   │   │       └── useAdminShortcuts.ts
│   │   └── ...
│   └── api/                    # Backend NestJS
│       └── src/
│           ├── products/
│           ├── orders/
│           ├── categories/
│           ├── auth/
│           └── payments/       # Stripe integration
├── scripts/
│   ├── update_images.py        # Actualiza imágenes de productos
│   └── seed_products.py        # Carga productos desde CSV
└── data/
    └── productos.csv           # Catálogo de medicamentos
```

---

## Funcionalidades Implementadas

### Catálogo de Productos
- [x] Vista lista y galería (toggle)
- [x] Búsqueda por nombre (Ctrl+K)
- [x] Filtro por categoría
- [x] Filtro "Solo disponibles"
- [x] Imágenes de productos (998/1111 con imagen)
- [x] Lazy loading de imágenes
- [x] Paginación
- [x] Toast notifications al agregar al carrito
- [x] Botón scroll-to-top
- [x] Barra inferior móvil con carrito

### Carrito y Checkout
- [x] Carrito persistente (Zustand)
- [x] Checkout con Stripe
- [x] Formulario de datos de envío
- [x] Confirmación de orden

### Panel de Administración
- [x] Layout con sidebar colapsable
- [x] Dashboard con gráficos (Recharts):
  - Ventas últimos 7 días (línea)
  - Órdenes por estado (torta)
  - Top productos vendidos (barras)
- [x] KPIs: ventas totales, órdenes, productos, stock crítico
- [x] CRUD productos (crear, editar, eliminar, duplicar)
- [x] CRUD categorías
- [x] Gestión de órdenes (ver, cambiar estado)
- [x] Command Palette (Cmd+K)
- [x] Atajos de teclado (G+D, G+P, G+O, etc.)
- [x] Badge órdenes pendientes
- [x] Badge stock crítico
- [x] Notificaciones (bell icon)
- [x] Responsive (drawer en móvil)

### Autenticación
- [x] Login/registro
- [x] JWT tokens
- [x] Rutas protegidas admin
- [x] Logout

---

## Variables de Entorno

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://pharmacy-ecommerce-production-5765.up.railway.app
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Backend (Railway)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=https://pharmacy-ecommerce-tau.vercel.app
```

---

## Comandos Útiles

```bash
# Desarrollo local
cd pharmacy-ecommerce
npm install
npm run dev          # Inicia frontend y backend

# Solo frontend
cd apps/web
npm run dev

# Solo backend
cd apps/api
npm run start:dev

# Build
npm run build

# Actualizar imágenes de productos
python scripts/update_images.py
```

---

## Endpoints API Principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /products | Lista productos (paginado) |
| GET | /products/:id | Detalle producto |
| GET | /categories | Lista categorías |
| POST | /auth/login | Login |
| POST | /auth/register | Registro |
| POST | /orders | Crear orden |
| GET | /admin/orders | Órdenes (admin) |
| PATCH | /admin/orders/:id | Actualizar orden |
| POST | /admin/products | Crear producto |
| PUT | /admin/products/:id | Editar producto |
| DELETE | /admin/products/:id | Eliminar producto |
| POST | /payments/create-intent | Crear Stripe PaymentIntent |

---

## Mejoras Pendientes (Prioridad)

### Alta
- [ ] Modo oscuro completo con toggle
- [ ] Filtros avanzados en órdenes (fecha, monto)
- [ ] Export CSV de órdenes

### Media
- [ ] Timeline visual de estado de orden
- [ ] Notificaciones en tiempo real (polling)
- [ ] Bulk actions en productos

### Baja
- [ ] Reportes de ventas
- [ ] Gestión de usuarios
- [ ] Logs de actividad

---

## Notas Importantes

1. **Imágenes**: Se obtienen de DuckDuckGo buscando "{nombre} {laboratorio} producto chile"
2. **Stripe**: Configurado en modo producción con claves live
3. **Admin**: Acceso en /admin, requiere usuario con rol admin
4. **Base de datos**: PostgreSQL en Railway, conexión pooled
5. **Monorepo**: Usa estructura monorepo con apps/web y apps/api

---

## Credenciales de Prueba

- **Admin**: admin@tufarmacia.cl / admin123
- **Usuario**: test@test.com / test123

---

## Archivos Clave para Modificar

| Archivo | Propósito |
|---------|-----------|
| `apps/web/src/app/page.tsx` | Catálogo principal |
| `apps/web/src/app/admin/page.tsx` | Dashboard admin |
| `apps/web/src/app/admin/layout.tsx` | Layout admin |
| `apps/web/src/components/admin/Sidebar.tsx` | Navegación admin |
| `apps/web/src/lib/api.ts` | Cliente API |
| `apps/web/src/store/cart.ts` | Estado carrito |
| `apps/api/src/products/products.service.ts` | Lógica productos |
| `apps/api/src/orders/orders.service.ts` | Lógica órdenes |
