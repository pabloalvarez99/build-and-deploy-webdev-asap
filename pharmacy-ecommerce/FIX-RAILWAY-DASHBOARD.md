# Arreglar Deployment en Railway (Dashboard)

## El Problema

El servicio `build-and-deploy-webdev-asap` está fallando porque no tiene configurado el **Root Directory**. Railway intenta compilar todo el monorepo en vez del servicio específico.

## Solución Rápida (5 minutos)

### Paso 1: Arreglar el servicio existente para order-service

1. Ve a Railway dashboard: https://railway.app
2. Abre tu proyecto `keen-nourishment`
3. Click en el servicio `build-and-deploy-webdev-asap`
4. Click en **Settings** (engranaje)
5. En la sección **Source**:
   - **Root Directory**: `apps/order-service`
   - **Dockerfile Path**: `Dockerfile`
6. Click en **Deploy** (arriba a la derecha)

### Paso 2: Agregar variables a order-service

Click en la pestaña **Variables** y agrega:

```
DATABASE_URL = postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway

REDIS_URL = redis://default:lAgeHtiUTWnpraEoMyovuHlnRePhWuhU@redis.railway.internal:6379

JWT_SECRET = tu-farmacia-jwt-secret-production-min-32-chars

MERCADOPAGO_ACCESS_TOKEN = (tu token de MercadoPago)

PORT = 3003

FRONTEND_URL = http://localhost:3000

WEBHOOK_URL = https://temp.com
```

Luego click **Deploy** de nuevo.

### Paso 3: Crear product-service

1. En el dashboard del proyecto, click **+ New**
2. Selecciona **GitHub Repo**
3. Selecciona tu repo: `build-and-deploy-webdev-asap`
4. En **Settings**:
   - **Root Directory**: `apps/product-service`
   - **Dockerfile Path**: `Dockerfile`
5. En **Variables** agrega:

```
DATABASE_URL = postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway

JWT_SECRET = tu-farmacia-jwt-secret-production-min-32-chars

PORT = 3002
```

6. Click **Deploy**

### Paso 4: Crear auth-service (Opcional)

1. Click **+ New** → **GitHub Repo**
2. Selecciona tu repo
3. En **Settings**:
   - **Root Directory**: `apps/auth-service`
   - **Dockerfile Path**: `Dockerfile`
4. En **Variables**:

```
DATABASE_URL = postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway

JWT_SECRET = tu-farmacia-jwt-secret-production-min-32-chars

PORT = 3001
```

5. Click **Deploy**

### Paso 5: Actualizar WEBHOOK_URL

Después de que order-service se despliegue exitosamente:

1. Copia la URL pública del servicio (ej: `order-service-production-abc.up.railway.app`)
2. Ve a order-service → **Variables**
3. Edita `WEBHOOK_URL` a: `https://order-service-production-abc.up.railway.app/api/webhook/mercadopago`
4. Redeploy

### Paso 6: Verificar Deployments

Cada servicio debería mostrar "Active" y logs de:
- `Server running on 0.0.0.0:3002` (product-service)
- `Server running on 0.0.0.0:3003` (order-service)
- `Server running on 0.0.0.0:3001` (auth-service)

Prueba los health endpoints (reemplaza con tus URLs):

```
https://product-service-production.up.railway.app/health
https://order-service-production.up.railway.app/health
https://auth-service-production.up.railway.app/health
```

Todos deberían responder: `OK`

### Paso 7: Correr Migraciones de Base de Datos

1. En Railway dashboard, click en el servicio **PostgreSQL**
2. Click en **Connect** → **Query**
3. Abre el archivo: `C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce\database\migrations\001_initial.sql`
4. Copia TODO el contenido
5. Pégalo en el editor de Railway
6. Click **Execute**

Deberías ver: "Query executed successfully"

## Siguiente Paso: Deploy Frontend

Una vez que los 3 servicios backend estén funcionando:

1. Copia las URLs públicas de cada servicio
2. Sigue la guía en `DEPLOY-FRONTEND.md`

## Troubleshooting

### "Healthcheck failed"
- Revisa los logs del servicio
- Verifica que todas las variables estén configuradas
- Asegúrate que el Root Directory esté correcto

### "Build failed"
- Revisa que el Dockerfile Path sea solo `Dockerfile`
- Verifica que el Root Directory sea exacto: `apps/order-service`

### "Database connection error"
- Usa las URLs internas (`postgres.railway.internal` y `redis.railway.internal`)
- No uses las URLs públicas para conexiones entre servicios
