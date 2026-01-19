# Contexto del Proyecto - Tu Farmacia E-commerce

Este archivo contiene toda la informacion necesaria para que Claude Code entienda el proyecto rapidamente.

---

## Resumen del Proyecto

**Tu Farmacia** es un e-commerce de farmacia chilena con:
- Catalogo de ~1200 productos/medicamentos
- Carrito de compras
- Panel de administracion
- Integracion con MercadoPago (pendiente)

---

## Stack Tecnologico

### Frontend (Este repositorio)
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS
- **Estado**: Zustand (stores en `/src/store/`)
- **Graficos**: Recharts
- **Iconos**: Lucide React

### Backend (Servicios externos desplegados)
- **Auth Service**: `https://auth-service-production-c853.up.railway.app`
- **Product Service**: `https://product-service-production-0ca8.up.railway.app`
- **Order Service**: `https://order-service-production-2da5.up.railway.app`
- **Base de datos**: PostgreSQL (Railway)

---

## Estructura del Proyecto

```
pharmacy-ecommerce/
├── apps/web/                    # Aplicacion Next.js
│   ├── src/
│   │   ├── app/                 # Rutas (App Router)
│   │   │   ├── page.tsx         # Catalogo principal
│   │   │   ├── producto/[slug]/ # Detalle producto
│   │   │   ├── carrito/         # Carrito de compras
│   │   │   ├── auth/login/      # Login
│   │   │   └── admin/           # Panel administracion
│   │   │       ├── page.tsx     # Dashboard con graficos
│   │   │       ├── productos/   # CRUD productos
│   │   │       ├── ordenes/     # Gestion ordenes
│   │   │       └── categorias/  # Gestion categorias
│   │   ├── components/          # Componentes reutilizables
│   │   ├── store/               # Zustand stores
│   │   │   ├── auth.ts          # Autenticacion
│   │   │   └── cart.ts          # Carrito
│   │   └── lib/
│   │       ├── api.ts           # Cliente API
│   │       └── format.ts        # Formateo precios
│   └── public/                  # Assets estaticos
├── scripts/                     # Scripts Python
│   ├── import_products.py       # Importar desde Excel
│   └── update_images.py         # Actualizar imagenes productos
└── database/                    # Migraciones SQL
```

---

## Paginas Principales

### Tienda (Publico)
| Ruta | Descripcion |
|------|-------------|
| `/` | Catalogo con tabla/galeria, filtros, paginacion |
| `/producto/[slug]` | Detalle de producto |
| `/carrito` | Carrito de compras |
| `/auth/login` | Login (admin: admin@pharmacy.com / admin123) |

### Admin (Requiere rol admin)
| Ruta | Descripcion |
|------|-------------|
| `/admin` | Dashboard con KPIs y graficos |
| `/admin/productos` | CRUD productos, acciones masivas |
| `/admin/ordenes` | Lista ordenes, cambiar estado |
| `/admin/ordenes/[id]` | Detalle orden, timeline |
| `/admin/categorias` | Lista categorias (crear) |

---

## API Endpoints Disponibles

### Productos
```typescript
productApi.list(params)           // GET /products
productApi.get(slug)              // GET /products/:slug
productApi.create(token, data)    // POST /admin/products
productApi.update(token, id, data)// PUT /admin/products/:id
productApi.delete(token, id)      // DELETE /admin/products/:id
productApi.listCategories()       // GET /categories
```

### Ordenes
```typescript
orderApi.list(token, params)      // GET /orders
orderApi.get(token, id)           // GET /orders/:id
orderApi.updateStatus(token, id, status) // PUT /orders/:id/status
orderApi.guestCheckout(data)      // POST /guest-checkout
```

### Auth
```typescript
authApi.login(email, password)    // POST /auth/login
authApi.register(email, pw, name) // POST /auth/register
authApi.me(token)                 // GET /auth/me
```

---

## Funcionalidades Implementadas

### Catalogo (/)
- [x] Vista lista con imagenes de productos
- [x] Vista galeria (grid)
- [x] Toggle lista/galeria (persiste en localStorage)
- [x] Filtro por laboratorio
- [x] Ordenar por nombre/precio/stock
- [x] Filtro "Solo disponibles"
- [x] Busqueda con debounce
- [x] Atajo Ctrl+K para buscar
- [x] Paginacion
- [x] Lazy loading imagenes
- [x] Toast al agregar al carrito
- [x] Scroll to top al cambiar pagina
- [x] Barra carrito flotante en movil

### Dashboard Admin (/admin)
- [x] KPIs: productos, categorias, ventas, pendientes, stock bajo, agotados
- [x] Grafico linea: ventas ultimos 7 dias
- [x] Grafico torta: ordenes por estado
- [x] Grafico barras: top productos
- [x] Widget stock critico
- [x] Widget ordenes recientes
- [x] Soporte modo oscuro (parcial)

### Productos Admin (/admin/productos)
- [x] Tabla con todos los productos
- [x] Crear/Editar/Eliminar producto
- [x] Acciones masivas (activar/desactivar/eliminar)
- [x] Exportar a CSV
- [x] Filtros por estado y busqueda
- [x] Imagen del producto en tabla

### Ordenes Admin (/admin/ordenes)
- [x] Lista de ordenes
- [x] Filtrar por estado
- [x] Ver detalle de orden
- [x] Cambiar estado de orden
- [x] Imprimir orden

---

## Pendiente por Implementar

### Alta Prioridad
- [ ] Layout admin con sidebar colapsable
- [ ] CRUD completo categorias (editar/eliminar)
- [ ] Command Palette (Cmd+K) en admin
- [ ] Duplicar producto

### Media Prioridad
- [ ] Filtros avanzados ordenes (fecha, monto)
- [ ] Exportar ordenes CSV
- [ ] Timeline visual estado orden
- [ ] Notificaciones tiempo real

### Baja Prioridad
- [ ] Modo oscuro completo
- [ ] Edicion inline productos
- [ ] Integracion MercadoPago

---

## Comandos Utiles

```bash
# Desarrollo
cd pharmacy-ecommerce/apps/web
npm run dev

# Build
npm run build

# Deploy (automatico con Vercel en push a main)
git push origin main
```

---

## Variables de Entorno

El proyecto usa URLs hardcodeadas en `lib/api.ts`:
```typescript
const AUTH_URL = 'https://auth-service-production-c853.up.railway.app';
const PRODUCT_URL = 'https://product-service-production-0ca8.up.railway.app';
const ORDER_URL = 'https://order-service-production-2da5.up.railway.app';
```

---

## Credenciales de Prueba

- **Admin**: admin@pharmacy.com / admin123
- **Usuario**: (crear con registro)

---

## Notas Importantes

1. **Imagenes de productos**: Se actualizan con `scripts/update_images.py` que busca en DuckDuckGo
2. **Base de datos**: Los productos se importan desde Excel con `scripts/import_products.py`
3. **Deploy**: Automatico en Vercel al hacer push a main
4. **Backend**: Esta desplegado en Railway, no se modifica desde este repo

---

## Proximos Pasos Recomendados

1. Implementar sidebar admin (ver `docs/ADMIN_IMPROVEMENTS.md`)
2. Completar CRUD categorias
3. Agregar Command Palette
4. Implementar checkout con MercadoPago
