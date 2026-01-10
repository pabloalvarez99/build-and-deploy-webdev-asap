# 🚀 Deploy Tu Farmacia en 30 Minutos

## ✅ Todo está listo. Solo sigue estos 4 pasos:

---

## PASO 1: Railway Backend (15 min)

### 1.1 Abrir Railway
https://railway.app/project/f9fb341e-dfa9-4e46-aefa-b4fd9115c86d

### 1.2 Configurar order-service (servicio existente)
1. Click en `build-and-deploy-webdev-asap`
2. Settings → **Root Directory**: `apps/order-service`
3. Variables → Click "Raw Editor" y pega:
```
DATABASE_URL=postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway
REDIS_URL=redis://default:lAgeHtiUTWnpraEoMyovuHlnRePhWuhU@redis.railway.internal:6379
JWT_SECRET=tu-farmacia-jwt-secret-production-min-32-chars
MERCADOPAGO_ACCESS_TOKEN=TU_TOKEN_AQUI
PORT=3003
FRONTEND_URL=http://localhost:3000
WEBHOOK_URL=https://temp.com
```
4. Deploy

### 1.3 Crear product-service
1. **+ New** → **GitHub Repo** → Tu repo
2. Settings → **Root Directory**: `apps/product-service`
3. Variables → Raw Editor:
```
DATABASE_URL=postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway
JWT_SECRET=tu-farmacia-jwt-secret-production-min-32-chars
PORT=3002
```
4. Deploy

### 1.4 Crear auth-service (opcional)
1. **+ New** → **GitHub Repo** → Tu repo
2. Settings → **Root Directory**: `apps/auth-service`
3. Variables → Raw Editor:
```
DATABASE_URL=postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway
JWT_SECRET=tu-farmacia-jwt-secret-production-min-32-chars
PORT=3001
```
4. Deploy

---

## PASO 2: Migraciones DB (2 min)

1. Railway → **PostgreSQL** → **Connect** → **Query**
2. Copia y ejecuta: `database/migrations/001_initial.sql`
3. Copia y ejecuta: `database/migrations/002_guest_checkout.sql`

---

## PASO 3: Vercel Frontend (10 min)

### 3.1 Deploy
```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce\apps\web"
vercel login
vercel
```

### 3.2 Configurar Variables
1. Vercel dashboard → Tu proyecto → **Settings** → **Environment Variables**
2. Agrega (reemplaza URLs con las de tus servicios Railway):
```
NEXT_PUBLIC_PRODUCT_SERVICE_URL=https://product-service-production.up.railway.app
NEXT_PUBLIC_ORDER_SERVICE_URL=https://order-service-production.up.railway.app
NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-service-production.up.railway.app
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-tu-public-key
```

### 3.3 Redeploy
```powershell
vercel --prod
```

---

## PASO 4: Actualizar URLs (3 min)

### 4.1 Actualizar WEBHOOK_URL
1. Railway → **order-service** → **Variables**
2. Edita `WEBHOOK_URL` con la URL pública de order-service:
```
WEBHOOK_URL=https://order-service-production-abc.up.railway.app/api/webhook/mercadopago
```

### 4.2 Actualizar FRONTEND_URL
1. Railway → **order-service** → **Variables**
2. Edita `FRONTEND_URL` con tu URL de Vercel:
```
FRONTEND_URL=https://tu-farmacia.vercel.app
```

---

## ✓ Verificación

### Health Checks (deben responder "OK"):
- https://product-service-url/health
- https://order-service-url/health
- https://auth-service-url/health

### Test Completo:
1. Abre tu app en Vercel
2. Navega a productos
3. Agrega al carrito
4. Haz checkout como invitado
5. Completa pago con tarjeta de prueba:
   - Número: `5031 7557 3453 0604`
   - CVV: `123`
   - Fecha: Futura
   - Nombre: `APRO`

---

## 📁 Archivos de Ayuda

- **VARIABLES-COPIAR-PEGAR.md** - Todas las variables listas
- **FIX-RAILWAY-DASHBOARD.md** - Guía detallada Railway
- **DEPLOY-FRONTEND.md** - Guía detallada Vercel
- **CHECKLIST-FINAL.md** - Checklist completo

---

## 🆘 Troubleshooting

**Service no inicia:**
- Revisa logs en Railway Dashboard
- Verifica que Root Directory esté correcto
- Asegúrate que todas las variables estén configuradas

**Frontend no conecta:**
- Verifica URLs en variables de Vercel
- Asegúrate que servicios estén "Active" en Railway
- Revisa CORS (ya configurado)

**MercadoPago error:**
- Verifica que Access Token y Public Key coincidan
- Ambos deben ser TEST o ambos PROD
- Access Token en backend, Public Key en frontend

---

## ⏱️ Timeline

- ✓ 0-15 min: Railway backend
- ✓ 15-17 min: Migraciones
- ✓ 17-27 min: Vercel frontend
- ✓ 27-30 min: Actualizar URLs y verificar

**¡Listo en 30 minutos!** 🎉

---

## 🎯 Lo Que Necesitas

**Ya tienes:**
- ✓ Código listo
- ✓ Docker configs
- ✓ Railway configs
- ✓ DB migrations
- ✓ DATABASE_URL
- ✓ REDIS_URL
- ✓ JWT_SECRET

**Necesitas:**
- ⚠ MERCADOPAGO_ACCESS_TOKEN (obtén en https://www.mercadopago.com.cl/developers/panel/app)
- ⚠ MERCADOPAGO_PUBLIC_KEY (obtén en https://www.mercadopago.com.cl/developers/panel/app)

---

**Siguiente:** Abre Railway Dashboard y comienza el Paso 1 👆
