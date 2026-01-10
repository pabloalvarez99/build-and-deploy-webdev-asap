# 📋 Variables para Copiar y Pegar

## Railway - Backend Services

### Product Service (Port 3002)

```
DATABASE_URL
postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway
```

```
JWT_SECRET
tu-farmacia-jwt-secret-production-min-32-chars
```

```
PORT
3002
```

---

### Order Service (Port 3003)

```
DATABASE_URL
postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway
```

```
REDIS_URL
redis://default:lAgeHtiUTWnpraEoMyovuHlnRePhWuhU@redis.railway.internal:6379
```

```
JWT_SECRET
tu-farmacia-jwt-secret-production-min-32-chars
```

```
MERCADOPAGO_ACCESS_TOKEN
(pega tu token de MercadoPago aquí)
```

```
PORT
3003
```

```
FRONTEND_URL
http://localhost:3000
```
(Actualiza después con tu URL de Vercel)

```
WEBHOOK_URL
https://temp.com
```
(Actualiza después con la URL pública de order-service)

---

### Auth Service (Port 3001) - Opcional

```
DATABASE_URL
postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@postgres.railway.internal:5432/railway
```

```
JWT_SECRET
tu-farmacia-jwt-secret-production-min-32-chars
```

```
PORT
3001
```

---

## Vercel - Frontend

### Environment Variables

```
NEXT_PUBLIC_PRODUCT_SERVICE_URL
https://product-service-production.up.railway.app
```
(Reemplaza con la URL real de tu product-service)

```
NEXT_PUBLIC_ORDER_SERVICE_URL
https://order-service-production.up.railway.app
```
(Reemplaza con la URL real de tu order-service)

```
NEXT_PUBLIC_AUTH_SERVICE_URL
https://auth-service-production.up.railway.app
```
(Reemplaza con la URL real de tu auth-service)

```
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
TEST-tu-public-key-aqui
```
(Usa tu MercadoPago Public Key)

---

## Railway Settings

### Para cada servicio:

**Root Directory:**
- product-service: `apps/product-service`
- order-service: `apps/order-service`
- auth-service: `apps/auth-service`

**Dockerfile Path:**
```
Dockerfile
```

---

## Después del Deployment

### Actualizar order-service:

```
WEBHOOK_URL
https://order-service-production-ABC123.up.railway.app/api/webhook/mercadopago
```
(Reemplaza ABC123 con tu subdomain de Railway)

```
FRONTEND_URL
https://tu-farmacia.vercel.app
```
(Reemplaza con tu URL real de Vercel)

---

## MercadoPago

Obtén tus credenciales en:
https://www.mercadopago.com.cl/developers/panel/app

**Para desarrollo/testing:**
- Usa credenciales TEST
- TEST-1234567890-...

**Para producción:**
- Usa credenciales PROD
- APP_USR-1234567890-...

---

## Notas Importantes

1. **URLs Internas vs Públicas:**
   - Para conexiones entre servicios de Railway: usa URLs internas (*.railway.internal)
   - Para frontend o webhooks externos: usa URLs públicas (*.up.railway.app)

2. **JWT Secret:**
   - Debe ser el mismo en todos los servicios
   - Mínimo 32 caracteres
   - Puedes generar uno nuevo si quieres más seguridad

3. **MercadoPago:**
   - Access Token (privado) va en el backend (order-service)
   - Public Key (público) va en el frontend (Vercel)
   - Ambos deben ser de la misma cuenta y mismo modo (TEST o PROD)

4. **WEBHOOK_URL:**
   - Debe ser la URL pública completa
   - Debe terminar en /api/webhook/mercadopago
   - Ejemplo: https://order-service-production-abc.up.railway.app/api/webhook/mercadopago

5. **FRONTEND_URL:**
   - Debe ser la URL pública de Vercel
   - Sin trailing slash
   - Ejemplo: https://tu-farmacia.vercel.app
