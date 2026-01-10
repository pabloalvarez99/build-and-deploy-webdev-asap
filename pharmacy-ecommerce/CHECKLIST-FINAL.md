# ✅ Checklist Final de Deployment - Tu Farmacia

## 📦 Archivos y Configuraciones Preparadas

### Backend Services (Railway)
- [x] product-service Dockerfile
- [x] order-service Dockerfile
- [x] auth-service Dockerfile
- [x] Railway.toml configs
- [x] .railwayignore

### Frontend (Vercel)
- [x] Next.js configurado con output: standalone
- [x] Dockerfile para web (opcional)
- [x] Variables de entorno documentadas

### Base de Datos
- [x] Migración 001_initial.sql (tablas principales)
- [x] Migración 002_guest_checkout.sql (guest checkout)

### Documentación
- [x] FIX-RAILWAY-DASHBOARD.md (guía deployment backend)
- [x] DEPLOY-FRONTEND.md (guía deployment frontend)
- [x] RESUMEN-DEPLOY.md (overview completo)
- [x] START-HERE.md (guía rápida)
- [x] Variables de entorno template

---

## 🚀 Lo Que Debes Hacer Ahora

### Paso 1: Deploy Backend en Railway (15 min)

Ve a **Railway Dashboard**: https://railway.app/project/f9fb341e-dfa9-4e46-aefa-b4fd9115c86d

#### 1.1 Arreglar servicio existente → order-service

1. Click en servicio `build-and-deploy-webdev-asap`
2. Settings → Service
   - **Root Directory**: `apps/order-service`
   - **Dockerfile Path**: `Dockerfile`
3. Variables → Agregar:
   ```
   DATABASE_URL=postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway
   REDIS_URL=redis://default:lAgeHtiUTWnpraEoMyovuHlnRePhWuhU@redis.railway.internal:6379
   JWT_SECRET=tu-farmacia-jwt-secret-production-min-32-chars
   MERCADOPAGO_ACCESS_TOKEN=(tu token aquí)
   PORT=3003
   FRONTEND_URL=http://localhost:3000
   WEBHOOK_URL=https://temp.com
   ```
4. Deploy

#### 1.2 Crear product-service

1. Click **+ New** → **GitHub Repo**
2. Selecciona tu repo
3. Settings → Service
   - **Root Directory**: `apps/product-service`
   - **Dockerfile Path**: `Dockerfile`
4. Variables:
   ```
   DATABASE_URL=postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway
   JWT_SECRET=tu-farmacia-jwt-secret-production-min-32-chars
   PORT=3002
   ```
5. Deploy

#### 1.3 Crear auth-service (opcional)

1. Click **+ New** → **GitHub Repo**
2. Settings → Service
   - **Root Directory**: `apps/auth-service`
   - **Dockerfile Path**: `Dockerfile`
3. Variables:
   ```
   DATABASE_URL=postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway
   JWT_SECRET=tu-farmacia-jwt-secret-production-min-32-chars
   PORT=3001
   ```
4. Deploy

#### 1.4 Actualizar WEBHOOK_URL

Después de que order-service despliegue:
1. Copia su URL pública (ej: `order-service-production-abc.up.railway.app`)
2. Variables → Edita `WEBHOOK_URL`:
   ```
   WEBHOOK_URL=https://order-service-production-abc.up.railway.app/api/webhook/mercadopago
   ```

### Paso 2: Migraciones de Base de Datos (2 min)

1. Railway Dashboard → PostgreSQL service → Connect → Query
2. Ejecuta en orden:

**Primera migración:**
```sql
-- Copia y pega TODO el contenido de:
database/migrations/001_initial.sql
```

**Segunda migración:**
```sql
-- Copia y pega TODO el contenido de:
database/migrations/002_guest_checkout.sql
```

### Paso 3: Deploy Frontend en Vercel (10 min)

```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce\apps\web"
vercel login
vercel
```

Después del primer deploy:
1. Ve a Vercel dashboard
2. Project Settings → Environment Variables
3. Agrega (reemplaza con tus URLs de Railway):
   ```
   NEXT_PUBLIC_PRODUCT_SERVICE_URL=https://product-service-production.up.railway.app
   NEXT_PUBLIC_ORDER_SERVICE_URL=https://order-service-production.up.railway.app
   NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-service-production.up.railway.app
   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-tu-public-key
   ```
4. Redeploy:
   ```powershell
   vercel --prod
   ```

### Paso 4: Actualizar FRONTEND_URL en Railway

1. Copia tu URL de Vercel (ej: `tu-farmacia.vercel.app`)
2. Railway → order-service → Variables
3. Edita `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://tu-farmacia.vercel.app
   ```

---

## ✓ Verificación Final

### Health Checks (todos deben responder "OK"):
```bash
curl https://product-service-url.railway.app/health
curl https://order-service-url.railway.app/health
curl https://auth-service-url.railway.app/health
```

### Test Frontend:
1. [ ] Abre https://tu-app.vercel.app
2. [ ] Se muestran los productos
3. [ ] Puedes agregar al carrito
4. [ ] El carrito persiste al recargar
5. [ ] Checkout sin login funciona
6. [ ] Redirige a MercadoPago
7. [ ] Después del pago vuelve al sitio

### Test con Tarjeta de Prueba MercadoPago:
- Número: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: Cualquier fecha futura
- Nombre: `APRO`

---

## 📝 Variables de Entorno - Referencia Rápida

### Ya las tienes:
```
DATABASE_URL=postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway
REDIS_URL=redis://default:lAgeHtiUTWnpraEoMyovuHlnRePhWuhU@redis.railway.internal:6379
JWT_SECRET=tu-farmacia-jwt-secret-production-min-32-chars
```

### Necesitas obtener:
- [ ] `MERCADOPAGO_ACCESS_TOKEN` - Token privado de MercadoPago
- [ ] `MERCADOPAGO_PUBLIC_KEY` - Token público de MercadoPago

---

## 🎯 Tiempo Total Estimado

- Backend Railway: 15 min
- Migraciones: 2 min
- Frontend Vercel: 10 min
- Verificación: 5 min

**Total: ~30 minutos**

---

## 🆘 Si Algo Falla

1. **Logs en Railway**: Click servicio → Deployments → Ver logs
2. **Logs en Vercel**: Vercel dashboard → Deployments → Function Logs
3. **Troubleshooting**: Ver `RAILWAY-FIX.md`

---

## 🎉 Después del Deployment

### Opcional - Configuración de Producción:
- [ ] Cambiar MercadoPago a modo producción
- [ ] Configurar dominio personalizado
- [ ] Configurar webhook en MercadoPago dashboard
- [ ] Habilitar backups automáticos de DB
- [ ] Configurar monitoreo

---

**Siguiente paso:** Abre Railway Dashboard y sigue el Paso 1 👆
