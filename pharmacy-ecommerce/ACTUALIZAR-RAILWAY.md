# 🔧 Actualizar Variables en Railway Dashboard

Las variables se actualizaron en el servicio incorrecto (Redis). Necesitas actualizarlas manualmente en el **order-service**.

## Paso 1: Ir a Railway Dashboard

1. Abre: https://railway.app/project/f9fb341e-dfa9-4e46-aefa-b4fd9115c86d
2. Click en el servicio **build-and-deploy-webdev-asap** (order-service)

## Paso 2: Actualizar Variables

Click en la pestaña **Variables** y actualiza/agrega estas 3:

### MERCADOPAGO_ACCESS_TOKEN
```
APP_USR-4790563553663084-010811-588bd914effd0972900f06380fc851d2-170193821
```

### FRONTEND_URL
```
https://tu-farmacia.vercel.app
```

### WEBHOOK_URL
```
https://build-and-deploy-webdev-asap-production.up.railway.app/api/webhook/mercadopago
```

### PORT (verificar que sea)
```
3003
```

## Paso 3: Guardar y Esperar Redeploy

Railway redeployará automáticamente el servicio (toma ~2 minutos).

## Paso 4: Verificar

1. Espera 2 minutos
2. Recarga la página: https://tu-farmacia.vercel.app
3. Agrega productos al carrito
4. Ve a checkout
5. El botón "Pagar con MercadoPago" debería estar habilitado
6. Click en el botón
7. Deberías ser redirigido a MercadoPago

---

## O usa este comando (más fácil):

Desde PowerShell:

```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce"

# Link al servicio correcto
railway link
# Selecciona: build-and-deploy-webdev-asap

cd apps\order-service

# Actualizar variables
railway variables --set "MERCADOPAGO_ACCESS_TOKEN=APP_USR-4790563553663084-010811-588bd914effd0972900f06380fc851d2-170193821"
railway variables --set "FRONTEND_URL=https://tu-farmacia.vercel.app"
railway variables --set "WEBHOOK_URL=https://build-and-deploy-webdev-asap-production.up.railway.app/api/webhook/mercadopago"
railway variables --set "PORT=3003"
```

Espera 2 minutos y prueba de nuevo.
