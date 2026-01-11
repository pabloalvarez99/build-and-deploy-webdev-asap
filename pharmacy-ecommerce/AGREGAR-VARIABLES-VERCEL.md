# Agregar Variables de Entorno en Vercel Dashboard

## Problema Actual
Las variables de entorno tienen `\nn\n` al final de cada valor, lo cual está rompiendo las URLs.

## Solución: Usar el Dashboard de Vercel

### Paso 1: Abrir el Dashboard
1. Ve a: https://vercel.com/pablo-figueroas-projects-015bb2fb/tu-farmacia
2. Click en **Settings**
3. Click en **Environment Variables** (menú izquierdo)

### Paso 2: Eliminar Variables Existentes
Elimina las siguientes variables (click en los 3 puntos → Delete):
- `NEXT_PUBLIC_PRODUCT_SERVICE_URL`
- `NEXT_PUBLIC_ORDER_SERVICE_URL`
- `NEXT_PUBLIC_AUTH_SERVICE_URL`
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`

### Paso 3: Agregar Variables Correctamente

**1. NEXT_PUBLIC_PRODUCT_SERVICE_URL**
- Key: `NEXT_PUBLIC_PRODUCT_SERVICE_URL`
- Value: `https://empathetic-wisdom-production-7d2f.up.railway.app`
- Environment: ☑ Production ☑ Preview ☑ Development
- Click "Save"

**2. NEXT_PUBLIC_ORDER_SERVICE_URL**
- Key: `NEXT_PUBLIC_ORDER_SERVICE_URL`
- Value: `https://build-and-deploy-webdev-asap-production.up.railway.app`
- Environment: ☑ Production ☑ Preview ☑ Development
- Click "Save"

**3. NEXT_PUBLIC_AUTH_SERVICE_URL**
- Key: `NEXT_PUBLIC_AUTH_SERVICE_URL`
- Value: `https://efficient-patience-production.up.railway.app`
- Environment: ☑ Production ☑ Preview ☑ Development
- Click "Save"

**4. NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY**
- Key: `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
- Value: `APP_USR-4bcad89a-4085-4e91-b547-5d53693895d4`
- Environment: ☑ Production ☑ Preview ☑ Development
- Click "Save"

### Paso 4: Redeploy
Después de agregar todas las variables:
1. Ve a la pestaña **Deployments**
2. Click en el último deployment (el más reciente)
3. Click en los 3 puntos (⋮)
4. Click en **Redeploy**
5. Confirma con "Redeploy"

### Paso 5: Verificar
Espera 1-2 minutos y luego:
1. Abre: https://tu-farmacia.vercel.app
2. Deberías ver los 8 productos cargando correctamente

---

**IMPORTANTE:** Al pegar las URLs, asegúrate de NO incluir espacios al inicio o al final.
