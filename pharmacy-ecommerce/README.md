# FarmaShop - E-commerce de Farmacia

E-commerce completo de farmacia con arquitectura de microservicios.

## Stack Tecnologico

- **Frontend**: Next.js 14, Bun, TypeScript, Tailwind CSS, Zustand
- **Backend**: Rust, Axum, SQLx, Redis
- **Base de datos**: PostgreSQL 16, Redis 7
- **Pagos**: MercadoPago
- **Contenedores**: Docker, Docker Compose

## Estructura del Proyecto

```
pharmacy-ecommerce/
├── apps/
│   ├── web/                 # Frontend Next.js
│   ├── auth-service/        # Servicio de autenticacion (Rust)
│   ├── product-service/     # Servicio de productos (Rust)
│   └── order-service/       # Servicio de ordenes y carrito (Rust)
├── packages/
│   └── shared/              # Tipos compartidos
├── database/
│   └── migrations/          # Migraciones SQL
├── docker-compose.yml
└── README.md
```

## Requisitos Previos

- Docker y Docker Compose
- Rust 1.75+ (para desarrollo local)
- Bun 1.0+ (para desarrollo local del frontend)
- Cuenta de MercadoPago (para pagos)

## Inicio Rapido

### 1. Clonar y configurar

```bash
cd pharmacy-ecommerce

# Copiar archivo de variables de entorno
cp .env.example .env

# Editar .env con tus credenciales de MercadoPago
```

### 2. Iniciar con Docker Compose (Desarrollo)

```bash
# Iniciar solo base de datos y Redis
docker-compose up -d postgres redis

# Esperar a que Postgres este listo
docker-compose logs -f postgres
```

### 3. Desarrollo Local

#### Backend (cada servicio en una terminal separada):

```bash
# Auth Service
cd apps/auth-service
cargo run

# Product Service
cd apps/product-service
cargo run

# Order Service
cd apps/order-service
cargo run
```

#### Frontend:

```bash
cd apps/web
bun install
bun dev
```

### 4. Produccion con Docker

```bash
# Construir y levantar todos los servicios
docker-compose up --build -d

# Ver logs
docker-compose logs -f
```

## Endpoints de la API

### Auth Service (puerto 3001)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | /api/auth/register | Registro de usuario |
| POST | /api/auth/login | Login (retorna JWT) |
| GET | /api/auth/me | Obtener usuario actual |

### Product Service (puerto 3002)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/products | Listar productos |
| GET | /api/products/:slug | Detalle de producto |
| POST | /api/products | Crear producto (admin) |
| PUT | /api/products/:id | Actualizar producto (admin) |
| DELETE | /api/products/:id | Eliminar producto (admin) |
| GET | /api/categories | Listar categorias |
| POST | /api/categories | Crear categoria (admin) |

### Order Service (puerto 3003)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | /api/cart | Obtener carrito |
| POST | /api/cart/add | Agregar al carrito |
| PUT | /api/cart/update | Actualizar cantidad |
| DELETE | /api/cart/remove/:id | Eliminar del carrito |
| POST | /api/checkout | Procesar pago (MercadoPago) |
| GET | /api/orders | Listar ordenes |
| GET | /api/orders/:id | Detalle de orden |
| POST | /api/webhook/mercadopago | Webhook de pagos |

## Credenciales de Prueba

- **Admin**: admin@pharmacy.com / admin123
- Los usuarios nuevos se crean con rol "user"

## Variables de Entorno

```env
# Base de datos
DATABASE_URL=postgres://postgres:postgres@localhost:5432/pharmacy
REDIS_URL=redis://localhost:6379

# Autenticacion
JWT_SECRET=tu-secreto-super-seguro-minimo-32-caracteres

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=tu-access-token
MERCADOPAGO_PUBLIC_KEY=tu-public-key

# URLs de servicios (para el frontend)
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:3001
NEXT_PUBLIC_PRODUCT_SERVICE_URL=http://localhost:3002
NEXT_PUBLIC_ORDER_SERVICE_URL=http://localhost:3003
```

## Configurar MercadoPago

1. Crear cuenta en [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
2. Crear una aplicacion
3. Obtener Access Token y Public Key
4. Configurar Webhook URL para notificaciones de pago:
   - URL: `https://tu-dominio.com/api/webhook/mercadopago`
   - Eventos: Pagos

## Arquitectura

```
┌─────────────┐     ┌─────────────────┐
│   Frontend  │────▶│   Auth Service  │
│  (Next.js)  │     │   (Rust/Axum)   │
└─────────────┘     └────────┬────────┘
       │                     │
       │            ┌────────▼────────┐
       │            │    PostgreSQL    │
       │            └────────▲────────┘
       │                     │
       ├───────────▶┌────────┴────────┐
       │            │ Product Service  │
       │            │   (Rust/Axum)    │
       │            └─────────────────┘
       │
       └───────────▶┌─────────────────┐     ┌───────────┐
                    │  Order Service   │────▶│   Redis   │
                    │   (Rust/Axum)    │     │  (Cart)   │
                    └────────┬────────┘     └───────────┘
                             │
                    ┌────────▼────────┐
                    │   MercadoPago   │
                    └─────────────────┘
```

## Funcionalidades

### Usuario
- Registro e inicio de sesion
- Navegacion por catalogo de productos
- Filtrado por categorias
- Busqueda de productos
- Carrito de compras (persistido en Redis)
- Checkout con MercadoPago
- Historial de pedidos

### Admin
- Gestion de productos (CRUD)
- Gestion de categorias
- Gestion de ordenes
- Cambio de estado de ordenes

## Desarrollo

### Ejecutar migraciones manualmente

```bash
# Conectar a PostgreSQL
docker-compose exec postgres psql -U postgres -d pharmacy

# Ejecutar migracion
\i /docker-entrypoint-initdb.d/001_initial.sql
```

### Limpiar base de datos

```bash
docker-compose down -v
docker-compose up -d postgres redis
```

## Licencia

MIT
