# Contexto Actual del Proyecto - Tu Farmacia E-commerce

**Fecha de última actualización**: 2026-01-11
**Estado**: En producción (parcial) - Problema de pago pendiente

---

## Estado General

**✅ ONLINE**:
- Backend (3 microservicios en Railway)
- Frontend (Next.js en Vercel)
- Base de datos PostgreSQL
- Redis cache
- Integración MercadoPago configurada

**❌ PROBLEMA PENDIENTE**:
- Botón de pago MercadoPago deshabilitado para cuentas personales
- Ver detalles en: `.claude/PROBLEMA-MERCADOPAGO.md`

---

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Backend** | Rust 1.75+ con Axum framework |
| **Frontend** | Next.js 14 + Bun + Tailwind CSS + Zustand |
| **Database** | PostgreSQL 16 (Railway managed) |
| **Cache** | Redis 7 (Railway managed) |
| **Deployment Backend** | Railway.app |
| **Deployment Frontend** | Vercel |
| **Payment Gateway** | MercadoPago Chile API |
| **Auth** | JWT tokens con argon2 hashing |

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│         Next.js App (Vercel)                                │
│         https://tu-farmacia.vercel.app                      │
│                                                              │
│    API Gateway Pattern (next.config.js rewrites)            │
└────────┬────────────────────────────────────────────────────┘
         │
         │ /backend/products/*  → product-service
         │ /backend/orders/*    → order-service
         │ /backend/auth/*      → auth-service
         │
┌────────┴─────────────────────────────────────────────────────┐
│                     RAILWAY BACKEND                          │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐     │
│  │   Product    │  │    Order     │  │     Auth      │     │
│  │   Service    │  │   Service    │  │   Service     │     │
│  │   (Rust)     │  │   (Rust)     │  │   (Rust)      │     │
│  │   Port 3002  │  │   Port 3003  │  │   Port 3001   │     │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘     │
│         │                  │                   │              │
│         └──────────┬───────┴───────────────────┘             │
│                    │                                          │
│         ┌──────────┴──────────┐                              │
│         │                     │                               │
│  ┌──────▼───────┐    ┌───────▼────┐                         │
│  │  PostgreSQL  │    │   Redis    │                         │
│  │   (Railway)  │    │  (Railway) │                         │
│  └──────────────┘    └────────────┘                         │
└──────────────────────────────────────────────────────────────┘
                           │
                           │ Webhooks
                           ▼
                   ┌───────────────┐
                   │  MercadoPago  │
                   │  API (Chile)  │
                   └───────────────┘
```

### Flujo de Datos:

1. **Usuario visita https://tu-farmacia.vercel.app**
2. **Next.js frontend** hace requests a `/backend/*` (rutas relativas)
3. **Vercel rewrites** proxy las requests a Railway backends
4. **Backend services** procesan la request y consultan PostgreSQL/Redis
5. **MercadoPago** maneja los pagos y envía webhooks al order-service

---

## URLs Importantes

### Frontend (Vercel)
- **Sitio en vivo**: https://tu-farmacia.vercel.app
- **Dashboard**: https://vercel.com/pablo-figueroas-projects-015bb2fb/tu-farmacia
- **Project ID**: prj_OfRAgKGzo9TrgQY1C2isbIzVrIs7
- **Org ID**: team_slBDUpChUWbGxQNGQWmWull3

### Backend Services (Railway)
- **Product Service**: https://empathetic-wisdom-production-7d2f.up.railway.app
- **Order Service**: https://build-and-deploy-webdev-asap-production.up.railway.app
- **Auth Service**: https://efficient-patience-production.up.railway.app
- **Railway Dashboard**: https://railway.app/project/f9fb341e-dfa9-4e46-aefa-b4fd9115c86d

### MercadoPago
- **Developer Panel**: https://www.mercadopago.com.cl/developers/panel/app/4790563553663084
- **Integration Quality**: https://www.mercadopago.com.cl/developers/panel/app/4790563553663084/integration-quality
- **Activities (Transactions)**: https://www.mercadopago.com.cl/activities
- **Application ID**: 4790563553663084
- **User ID**: 170193821

### Repositorio
- **GitHub**: https://github.com/pabloalvarez99/build-and-deploy-webdev-asap
- **Branch principal**: main

---

## Variables de Entorno Configuradas

### Railway - Order Service
```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-4790563553663084-010811-588bd914effd0972900f06380fc851d2-170193821
FRONTEND_URL=https://tu-farmacia.vercel.app
WEBHOOK_URL=https://build-and-deploy-webdev-asap-production.up.railway.app/api/webhook/mercadopago
PORT=3003
DATABASE_URL=postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway
REDIS_URL=redis://default:lAgeHtiUTWnpraEoMyovuHlnRePhWuhU@centerbeam.proxy.rlwy.net:21710
```

### Railway - Product Service
```bash
PORT=3002
DATABASE_URL=postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway
```

### Railway - Auth Service
```bash
PORT=3001
DATABASE_URL=postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRATION=86400
```

### Vercel - Frontend
**NO hay variables de entorno en Vercel**. Se usa el patrón API Gateway mediante rewrites en `next.config.js`.

---

## Último Commit Relevante

```
Commit Hash: 7028c618
Fecha: 2026-01-11
Autor: Pablo + Claude Sonnet 4.5

Mensaje: Mejorar calidad integración MercadoPago (39→73+ pts)

Archivos modificados:
- apps/order-service/src/handlers/checkout.rs
- apps/order-service/src/models/order.rs

Cambios implementados:
1. MercadoPagoItem struct:
   - Agregado: id (UUID del producto)
   - Agregado: description (descripción del producto)
   - Agregado: category_id (ID de categoría)

2. MercadoPagoPreference struct:
   - Agregado: payer (email del comprador)
   - Agregado: statement_descriptor ("Tu Farmacia")

3. Nuevo struct MercadoPagoPayer:
   - email (required)
   - name (optional)
   - surname (optional)

Estado: Deployado a Railway exitosamente ✅
```

---

## Problema Actual (Ver `.claude/PROBLEMA-MERCADOPAGO.md` para detalles)

**Síntoma**: Botón "Pagar" deshabilitado en MercadoPago al intentar pagar con cuenta personal.

**Causa probable**:
- MercadoPago puede tardar hasta 24h en re-evaluar la calidad de integración
- Posible falta de campos adicionales (payer.name, payer.surname)

**Estado**: En investigación

---

## Estructura del Proyecto

```
pharmacy-ecommerce/
├── .claude/                           # Contexto para Claude Code
│   ├── CONTEXTO-ACTUAL.md             # Este archivo
│   ├── PROBLEMA-MERCADOPAGO.md        # Problema pendiente
│   ├── HISTORIAL-CAMBIOS.md           # Log de cambios
│   └── SETUP-OTRO-PC.md               # Guía rápida
│
├── apps/
│   ├── web/                           # Next.js 14 frontend
│   │   ├── src/
│   │   │   ├── app/                   # App Router pages
│   │   │   ├── components/            # React components
│   │   │   ├── lib/api.ts             # API client
│   │   │   └── store/                 # Zustand stores
│   │   ├── next.config.js             # ⚠️ IMPORTANTE: API Gateway rewrites
│   │   └── package.json
│   │
│   ├── product-service/               # Rust/Axum - Gestión de productos
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── handlers/
│   │   │   └── models/
│   │   ├── Cargo.toml
│   │   └── Dockerfile
│   │
│   ├── order-service/                 # Rust/Axum - Órdenes + MercadoPago
│   │   ├── src/
│   │   │   ├── main.rs
│   │   │   ├── handlers/
│   │   │   │   └── checkout.rs        # ⚠️ IMPORTANTE: Lógica MercadoPago
│   │   │   ├── models/
│   │   │   │   └── order.rs           # ⚠️ IMPORTANTE: Structs MercadoPago
│   │   │   └── services/
│   │   │       └── mercadopago.rs
│   │   ├── Cargo.toml
│   │   └── Dockerfile
│   │
│   └── auth-service/                  # Rust/Axum - Autenticación JWT
│       ├── src/
│       ├── Cargo.toml
│       └── Dockerfile
│
├── database/
│   └── migrations/
│       ├── 001_initial.sql
│       └── 002_guest_checkout.sql
│
├── PRODUCCION-MERCADOPAGO.md          # Documentación de producción
├── ESTADO-PROBLEMA-PAGO.md            # Resumen del problema actual
└── README.md                          # Overview del proyecto
```

---

## API Endpoints

### Product Service (Port 3002)
```
GET    /api/products                  # Listar productos (paginado)
GET    /api/products/:slug            # Detalle producto
POST   /api/admin/products            # Crear producto (admin)
PUT    /api/admin/products/:id        # Actualizar producto (admin)
DELETE /api/admin/products/:id        # Eliminar producto (admin)
GET    /api/categories                # Listar categorías
POST   /api/admin/categories          # Crear categoría (admin)
```

### Order Service (Port 3003)
```
GET    /api/cart                      # Obtener carrito (auth)
POST   /api/cart/add                  # Agregar item (auth)
PUT    /api/cart/update               # Actualizar cantidad (auth)
DELETE /api/cart/remove/:id           # Eliminar item (auth)
DELETE /api/cart/clear                # Vaciar carrito (auth)

POST   /api/guest-checkout            # Checkout sin autenticación ⚠️ IMPORTANTE
POST   /api/checkout                  # Checkout autenticado
POST   /api/webhook/mercadopago       # Webhook de MercadoPago
GET    /api/orders                    # Historial de órdenes (auth)
GET    /api/orders/:id                # Detalle de orden (auth)
PUT    /api/orders/:id/status         # Actualizar estado (admin)
```

### Auth Service (Port 3001)
```
POST   /api/auth/register             # Registro de usuario
POST   /api/auth/login                # Login (retorna JWT)
GET    /api/auth/me                   # Info usuario actual (auth)
```

---

## Patrón API Gateway (Next.js Rewrites)

**Ubicación**: `apps/web/next.config.js`

El frontend hace requests a rutas relativas que Vercel proxy a Railway:

```javascript
rewrites() {
  return [
    {
      source: '/backend/products/:path*',
      destination: 'https://empathetic-wisdom-production-7d2f.up.railway.app/api/:path*'
    },
    {
      source: '/backend/orders/:path*',
      destination: 'https://build-and-deploy-webdev-asap-production.up.railway.app/api/:path*'
    },
    {
      source: '/backend/auth/:path*',
      destination: 'https://efficient-patience-production.up.railway.app/api/:path*'
    }
  ];
}
```

**Ventajas**:
- ✅ URLs de Railway nunca expuestas al cliente
- ✅ No depende de variables de entorno en Vercel
- ✅ Elimina problemas de CORS
- ✅ Más rápido (Vercel edge functions)

---

## Base de Datos (PostgreSQL)

### Tablas principales:

**users**: Usuarios registrados
- id (UUID)
- email
- password_hash (argon2)
- name
- role (admin/user)
- created_at

**categories**: Categorías de productos
- id (UUID)
- name
- slug
- description
- image_url
- active

**products**: Catálogo de productos
- id (UUID)
- name
- slug
- description
- price (DECIMAL)
- stock (INTEGER)
- category_id (FK)
- image_url
- active
- created_at
- updated_at

**orders**: Órdenes de compra
- id (UUID)
- user_id (FK, nullable para guest)
- guest_email (para checkout sin registro)
- guest_session_id (para checkout sin registro)
- status (pending/paid/failed/cancelled)
- total (DECIMAL)
- mercadopago_preference_id
- mercadopago_payment_id
- shipping_address
- notes
- created_at
- updated_at

**order_items**: Items de cada orden
- id (UUID)
- order_id (FK)
- product_id (FK, nullable)
- product_name (snapshot)
- quantity
- price_at_purchase (snapshot)
- created_at

---

## Redis Cache

**Uso**: Almacenar carritos de compra temporales

**Keys**:
- `cart:{user_id}` - Carrito de usuario autenticado
- `cart:{session_id}` - Carrito de usuario anónimo

**Estructura del valor**:
```json
{
  "items": [
    {
      "product_id": "uuid",
      "quantity": 2
    }
  ]
}
```

**TTL**: 7 días

---

## MercadoPago Integration

### Credenciales (Producción)
- **Public Key**: `APP_USR-4bcad89a-4085-4e91-b547-5d53693895d4`
- **Access Token**: `APP_USR-4790563553663084-010811-588bd914effd0972900f06380fc851d2-170193821`
- **Application ID**: 4790563553663084
- **User ID**: 170193821

### Flujo de Pago:
1. Usuario agrega productos al carrito
2. Click "Proceder al pago"
3. POST a `/backend/orders/guest-checkout` con items, email, dirección
4. Backend crea orden en DB (status: pending)
5. Backend crea preferencia en MercadoPago
6. Frontend redirige a `init_point` de MercadoPago
7. Usuario completa pago en MercadoPago
8. MercadoPago envía webhook a `/api/webhook/mercadopago`
9. Backend actualiza orden (status: paid/failed)
10. Usuario redirigido a `/checkout/success` o `/checkout/failure`

---

## Próximos Pasos

1. **Resolver problema de pago MercadoPago** (ver `.claude/PROBLEMA-MERCADOPAGO.md`)
   - Verificar puntaje de calidad de integración
   - Considerar agregar campos payer.name y payer.surname
   - Esperar posible re-evaluación de MercadoPago (24h)

2. **Funcionalidad "Retiro en tienda"**
   - Actualmente: Usuario escribe "Retiro en tienda" en dirección o notas
   - Mejora: Campo dedicado en el checkout

3. **Panel Admin**
   - Gestión de productos (CRUD completo)
   - Ver órdenes y actualizar estados
   - Filtrar órdenes por "retiro en tienda"

4. **Testing**
   - Tests unitarios para servicios Rust
   - Tests E2E para flujo de checkout

---

## Comandos Útiles

### Verificar Deployments
```bash
# Order service health
curl https://build-and-deploy-webdev-asap-production.up.railway.app/health

# Product service
curl https://empathetic-wisdom-production-7d2f.up.railway.app/api/products

# Frontend
curl https://tu-farmacia.vercel.app
```

### Railway CLI
```bash
# Login
railway login

# Link to project
railway link f9fb341e-dfa9-4e46-aefa-b4fd9115c86d

# Ver logs
railway logs --service build-and-deploy-webdev-asap

# Deploy
railway up --service build-and-deploy-webdev-asap
```

### Vercel CLI
```bash
# Login
vercel login

# Link to project
vercel link

# Deploy
vercel --prod
```

### Git
```bash
# Ver estado
git status

# Commit
git add .
git commit -m "Mensaje"

# Push
git push origin main
```

---

## Notas Importantes

- **Siempre leer** `.claude/PROBLEMA-MERCADOPAGO.md` antes de trabajar en el checkout
- **API Gateway en next.config.js** - NO usar variables de entorno para URLs de backend
- **Guest checkout** - Los usuarios NO necesitan registrarse para comprar
- **Carrito anónimo** - Se usa localStorage + session_id en el frontend
- **Webhooks de MercadoPago** - Confirmar que WEBHOOK_URL en Railway apunte al order-service correcto
- **Logs de Railway** - Revisar logs antes de hacer cambios

---

**Última actualización**: 2026-01-11 por Claude Sonnet 4.5
**Próxima revisión**: Después de resolver problema de pago MercadoPago
