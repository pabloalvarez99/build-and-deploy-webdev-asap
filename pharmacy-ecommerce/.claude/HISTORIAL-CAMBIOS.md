# Historial de Cambios Importantes

Documentación cronológica de cambios significativos en el proyecto Tu Farmacia E-commerce.

---

## 2026-01-11 - Mejora Calidad Integración MercadoPago

**Commit**: `7028c618`
**Autor**: Pablo + Claude Sonnet 4.5

### Problema
- Botón "Pagar" deshabilitado para cuentas personales de MercadoPago
- Calidad de integración: 39/100 (mínimo requerido: 73/100)

### Solución Implementada
Agregados campos requeridos por MercadoPago a la creación de preferencias de pago.

### Archivos Modificados

**1. `apps/order-service/src/models/order.rs`**

Cambios en `MercadoPagoItem`:
```rust
// ANTES:
pub struct MercadoPagoItem {
    pub title: String,
    pub quantity: i32,
    pub unit_price: i64,
    pub currency_id: String,
}

// DESPUÉS:
pub struct MercadoPagoItem {
    pub id: String,              // NUEVO
    pub title: String,
    pub description: Option<String>,    // NUEVO
    pub category_id: Option<String>,    // NUEVO
    pub quantity: i32,
    pub unit_price: i64,
    pub currency_id: String,
}
```

Cambios en `MercadoPagoPreference`:
```rust
// ANTES:
pub struct MercadoPagoPreference {
    pub items: Vec<MercadoPagoItem>,
    pub back_urls: MercadoPagoBackUrls,
    pub auto_return: Option<String>,
    pub external_reference: String,
    pub notification_url: Option<String>,
}

// DESPUÉS:
pub struct MercadoPagoPreference {
    pub items: Vec<MercadoPagoItem>,
    pub back_urls: MercadoPagoBackUrls,
    pub auto_return: Option<String>,
    pub external_reference: String,
    pub notification_url: Option<String>,
    pub payer: Option<MercadoPagoPayer>,         // NUEVO
    pub statement_descriptor: Option<String>,     // NUEVO
}

// NUEVO STRUCT:
pub struct MercadoPagoPayer {
    pub email: String,
    pub name: Option<String>,
    pub surname: Option<String>,
}
```

**2. `apps/order-service/src/handlers/checkout.rs`**

- Query SQL actualizada para obtener `description` y `category_id` de productos
- Items de MercadoPago poblados con `id`, `description`, `category_id`
- Preferencia de MercadoPago incluye `payer.email` y `statement_descriptor: "Tu Farmacia"`
- Cambios aplicados tanto en `checkout()` (auth) como en `guest_checkout()` (anon)

### Deploy
- ✅ Pusheado a GitHub
- ✅ Railway auto-deployed exitosamente
- ⏳ Esperando re-evaluación de calidad por MercadoPago (hasta 24h)

### Estado Actual
- Botón sigue deshabilitado
- Posible que MercadoPago tarde hasta 24h en re-evaluar
- Ver `.claude/PROBLEMA-MERCADOPAGO.md` para más detalles

---

## 2026-01-10 - Credenciales MercadoPago a Producción

### Problema
- Checkout funcionaba con tarjetas de prueba
- No funcionaba con cuentas reales de MercadoPago

### Solución
Cambiar credenciales de test a producción en Railway.

### Variables Actualizadas (Railway - Order Service)
```bash
# ANTES (test):
MERCADOPAGO_ACCESS_TOKEN=TEST-...

# DESPUÉS (producción):
MERCADOPAGO_ACCESS_TOKEN=APP_USR-4790563553663084-010811-588bd914effd0972900f06380fc851d2-170193821
MERCADOPAGO_PUBLIC_KEY=APP_USR-4bcad89a-4085-4e91-b547-5d53693895d4
```

### Credenciales de Producción
- Application ID: 4790563553663084
- User ID: 170193821
- Panel: https://www.mercadopago.com.cl/developers/panel/app/4790563553663084

### Deploy
- ✅ Variables actualizadas en Railway Dashboard
- ✅ Service redeployado automáticamente

### Documentación Creada
- `PRODUCCION-MERCADOPAGO.md` - Documentación completa de configuración de producción

---

## 2026-01-10 - Configuración Root Directory en Vercel

### Problema
- Deployment de Vercel retornaba 404 NOT_FOUND
- Vercel no encontraba el Next.js app

### Causa
- Root Directory no estaba configurada en Vercel
- Por defecto, Vercel buscaba en la raíz del repositorio
- El proyecto Next.js está en `pharmacy-ecommerce/apps/web`

### Solución
Configurar Root Directory en Vercel Dashboard.

### Pasos
1. Ir a: https://vercel.com/pablo-figueroas-projects-015bb2fb/tu-farmacia
2. Settings → General
3. Root Directory → `pharmacy-ecommerce/apps/web`
4. Save
5. Redeploy

### Resultado
- ✅ Deployment exitoso
- ✅ Sitio accesible en https://tu-farmacia.vercel.app
- ✅ HTTP 200 OK

---

## 2026-01-10 - Implementación API Gateway Pattern

**Commit**: `863a1baa`

### Problema
- Variables de entorno en Vercel CLI tenían `\nn\n` al final de cada valor
- URLs de backend corruptas: `https://railway.app\nn\n`
- Productos no se mostraban en el frontend
- API calls fallaban con URLs malformadas

### Causa Raíz
```bash
# Vercel CLI agregaba basura al final:
NEXT_PUBLIC_PRODUCT_SERVICE_URL="https://empathetic-wisdom-production-7d2f.up.railway.app\nn\n"
                                                                                        ^^^^^ BASURA
```

### Solución: API Gateway con Next.js Rewrites
En lugar de usar variables de entorno, usar rewrites en `next.config.js` para proxy requests del frontend a Railway.

### Archivos Modificados

**1. `apps/web/next.config.js`**

```javascript
// Agregado:
async rewrites() {
  return [
    {
      source: '/backend/products/:path*',
      destination: 'https://empathetic-wisdom-production-7d2f.up.railway.app/api/:path*',
    },
    {
      source: '/backend/orders/:path*',
      destination: 'https://build-and-deploy-webdev-asap-production.up.railway.app/api/:path*',
    },
    {
      source: '/backend/auth/:path*',
      destination: 'https://efficient-patience-production.up.railway.app/api/:path*',
    },
  ];
}
```

**2. `apps/web/src/lib/api.ts`**

```typescript
// ANTES:
const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_URL = process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL || 'http://localhost:3002';
const ORDER_URL = process.env.NEXT_PUBLIC_ORDER_SERVICE_URL || 'http://localhost:3003';

// DESPUÉS:
const AUTH_URL = '/backend/auth';
const PRODUCT_URL = '/backend/products';
const ORDER_URL = '/backend/orders';
```

Todas las rutas de API actualizadas:
- `/api/products` → `/products`
- `/api/auth/login` → `/auth/login`
- `/api/checkout` → `/checkout`
- etc.

### Ventajas del Cambio
1. ✅ **Elimina dependencia de env vars** - URLs hardcodeadas en config
2. ✅ **Mejora seguridad** - URLs de Railway nunca expuestas al cliente
3. ✅ **Elimina CORS** - Todas las requests son same-origin
4. ✅ **Más rápido** - Vercel edge functions cerca del usuario
5. ✅ **Mantenible** - Un solo archivo de configuración

### Deploy
- ✅ Pusheado a GitHub
- ✅ Vercel auto-deployed
- ✅ Productos se muestran correctamente

### Documentación Creada
- `AGREGAR-VARIABLES-VERCEL.md` - Documentación del problema y solución alternativa (ahora obsoleta)

---

## 2026-01-09 - Deploy Inicial a Railway y Vercel

### Railway Backend Services

**Deployados**:
- ✅ Product Service (port 3002)
- ✅ Order Service (port 3003)
- ✅ Auth Service (port 3001)
- ✅ PostgreSQL Database
- ✅ Redis Cache

**Variables de Entorno Configuradas**:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret para tokens JWT
- `PORT` - Puerto del servicio

### Vercel Frontend

**Deployado**:
- ✅ Next.js 14 app
- ✅ Build exitoso
- ✅ Sitio accesible (después de configurar Root Directory)

### Base de Datos

**Migraciones Ejecutadas**:
- ✅ `001_initial.sql` - Schema completo
- ✅ `002_guest_checkout.sql` - Guest checkout sin login

**Datos de Prueba**:
- ✅ 5 categorías
- ✅ 8 productos con precios, descripciones, imágenes

---

## 2026-01-08 - Implementación Guest Checkout

**Commit**: Parte de migrations `002_guest_checkout.sql`

### Problema
- Usuarios debían registrarse antes de comprar
- Fricción en el proceso de compra

### Solución
Implementar checkout sin autenticación usando sessionId.

### Cambios en Base de Datos

```sql
ALTER TABLE orders
ADD COLUMN guest_email VARCHAR(255),
ADD COLUMN guest_session_id VARCHAR(255);

-- user_id ahora nullable
ALTER TABLE orders
ALTER COLUMN user_id DROP NOT NULL;
```

### Cambios en Backend

**1. Nuevo modelo** (`apps/order-service/src/models/order.rs`):
```rust
pub struct GuestCheckoutRequest {
    pub items: Vec<GuestCheckoutItem>,
    pub email: String,
    pub shipping_address: Option<String>,
    pub notes: Option<String>,
    pub session_id: String,
}
```

**2. Nuevo endpoint** (`apps/order-service/src/handlers/checkout.rs`):
```rust
pub async fn guest_checkout(...) -> Result<...> {
    // Crear orden sin user_id
    // Almacenar guest_email y guest_session_id
    // Crear preferencia MercadoPago
    // Retornar init_point
}
```

**3. Nueva ruta** (`apps/order-service/src/main.rs`):
```rust
.route("/api/guest-checkout", post(guest_checkout))
// Sin middleware de autenticación
```

### Cambios en Frontend

**Carrito anónimo** (`apps/web/src/store/cart.ts`):
- Almacenado en localStorage
- Usa `sessionId` generado con UUID
- No requiere JWT token

**Checkout anónimo** (`apps/web/src/app/checkout/page.tsx`):
- No requiere login
- Pide solo email y dirección
- Envía sessionId al backend

### Resultado
✅ Usuarios pueden comprar sin crear cuenta

---

## 2026-01-07 - Arquitectura Inicial y Stack Tecnológico

### Decisiones de Arquitectura

**Microservicios en Rust**:
- Rust/Axum elegido por:
  - Performance (compiled, zero-cost abstractions)
  - Type safety (prevención de bugs)
  - Async I/O (Tokio runtime)
  - Deploy a Railway (Docker multi-stage builds)

**Frontend en Next.js 14**:
- Next.js 14 App Router
- Bun en lugar de npm (más rápido)
- Tailwind CSS (rapid UI development)
- Zustand (state management simple)

**Base de Datos PostgreSQL**:
- Railway managed PostgreSQL
- JSONB para datos flexibles (si necesario)
- UUIDs para IDs (distributed-friendly)

**Deployment**:
- Railway para backend (Rust + Docker)
- Vercel para frontend (Next.js optimizado)
- GitHub para CI/CD (auto-deploy on push)

### Estructura del Repositorio

```
pharmacy-ecommerce/
├── apps/
│   ├── web/              # Next.js 14 frontend
│   ├── auth-service/     # Rust/Axum - JWT auth
│   ├── product-service/  # Rust/Axum - CRUD productos
│   └── order-service/    # Rust/Axum - órdenes + MercadoPago
├── database/
│   └── migrations/       # SQL migrations
└── README.md
```

---

## Resumen de Cambios por Categoría

### Integración MercadoPago
1. **2026-01-11**: Mejora calidad integración (items, payer, statement_descriptor)
2. **2026-01-10**: Credenciales test → producción
3. **2026-01-08**: Integración inicial de Checkout Pro

### Deployment
1. **2026-01-10**: Configuración Root Directory en Vercel
2. **2026-01-10**: Implementación API Gateway Pattern
3. **2026-01-09**: Deploy inicial a Railway + Vercel

### Features
1. **2026-01-08**: Guest checkout sin login
2. **2026-01-07**: Arquitectura de microservicios
3. **2026-01-07**: Carrito en localStorage + Redis

### Infraestructura
1. **2026-01-09**: PostgreSQL + Redis en Railway
2. **2026-01-09**: Migraciones de base de datos
3. **2026-01-07**: Docker multi-stage builds para Rust

---

## Próximos Cambios Planeados

### Alta Prioridad
- [ ] **Resolver botón de pago deshabilitado** (ver `.claude/PROBLEMA-MERCADOPAGO.md`)
  - Esperar re-evaluación de MercadoPago (24h)
  - O agregar payer.name y payer.surname

### Media Prioridad
- [ ] **Funcionalidad "Retiro en tienda"**
  - Campo dedicado en checkout (actualmente en notes)
  - Filtro en panel admin para órdenes de retiro

- [ ] **Panel Admin completo**
  - Gestión de productos (CRUD completo)
  - Ver y actualizar estados de órdenes
  - Estadísticas básicas

### Baja Prioridad
- [ ] **Testing**
  - Tests unitarios para handlers Rust
  - Tests E2E para flujo de checkout

- [ ] **Dominio personalizado**
  - Configurar DNS para dominio custom
  - Actualizar variables FRONTEND_URL

---

**Última actualización**: 2026-01-11
**Formato**: Cambios más recientes primero (orden cronológico inverso en cada sección)
