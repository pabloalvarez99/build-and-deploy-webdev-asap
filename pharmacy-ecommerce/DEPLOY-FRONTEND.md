# Deploy Frontend a Vercel

## Prerrequisitos

- Los 3 servicios backend deben estar corriendo en Railway
- Tienes las URLs públicas de cada servicio
- Tienes tu MercadoPago Public Key

## Paso 1: Instalar Vercel CLI

```powershell
npm install -g vercel
```

## Paso 2: Login a Vercel

```powershell
vercel login
```

Esto abrirá tu navegador para autenticarte.

## Paso 3: Deploy desde el directorio web

```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce\apps\web"
vercel
```

Responde las preguntas:
- **Set up and deploy?** → Yes
- **Which scope?** → Tu cuenta personal
- **Link to existing project?** → No
- **What's your project's name?** → `tu-farmacia`
- **In which directory is your code located?** → `./`
- **Want to override the settings?** → No

Vercel detectará automáticamente Next.js y comenzará el deploy.

## Paso 4: Configurar Variables de Entorno

Después del primer deploy:

1. Ve a https://vercel.com
2. Abre tu proyecto `tu-farmacia`
3. Click en **Settings** → **Environment Variables**
4. Agrega estas variables:

### Variables a agregar:

**NEXT_PUBLIC_PRODUCT_SERVICE_URL**
```
https://product-service-production.up.railway.app
```
(Reemplaza con la URL real de tu product-service en Railway)

**NEXT_PUBLIC_ORDER_SERVICE_URL**
```
https://order-service-production.up.railway.app
```
(Reemplaza con la URL real de tu order-service en Railway)

**NEXT_PUBLIC_AUTH_SERVICE_URL**
```
https://auth-service-production.up.railway.app
```
(Reemplaza con la URL real de tu auth-service en Railway)

**NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY**
```
TEST-tu-public-key-aqui
```
(Usa tu MercadoPago Public Key - TEST para pruebas, producción para producción)

5. Para cada variable:
   - Click **Add New**
   - Name: el nombre de la variable
   - Value: el valor
   - Environment: Marca **Production**, **Preview**, y **Development**
   - Click **Save**

## Paso 5: Redeploy con las Variables

Después de agregar todas las variables:

```powershell
vercel --prod
```

Esto hará un deploy de producción con todas las variables configuradas.

## Paso 6: Actualizar FRONTEND_URL en Railway

Después de que Vercel despliegue:

1. Copia tu URL de Vercel (ej: `tu-farmacia.vercel.app`)
2. Ve a Railway dashboard
3. Abre el servicio **order-service**
4. Ve a **Variables**
5. Edita `FRONTEND_URL` a: `https://tu-farmacia.vercel.app`
6. Click **Deploy** para recargar el servicio

## Paso 7: Configurar MercadoPago Webhook (Opcional)

Si quieres recibir notificaciones de pago:

1. Ve a https://www.mercadopago.com.cl/developers/panel/webhooks
2. Click **Crear webhook**
3. URL: `https://order-service-production.up.railway.app/api/webhook/mercadopago`
4. Eventos: Selecciona **Payments** y **Merchant Orders**
5. Guarda

## Paso 8: Probar la Aplicación

1. Abre tu app en: `https://tu-farmacia.vercel.app`
2. Navega a la tienda
3. Agrega productos al carrito
4. Haz checkout como invitado
5. Completa el pago con MercadoPago

### Test con Tarjetas de Prueba de MercadoPago:

**Aprobada:**
- Número: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: Cualquier fecha futura
- Nombre: `APRO`

**Rechazada:**
- Número: `5031 7557 3453 0604`
- CVV: `123`
- Fecha: Cualquier fecha futura
- Nombre: `OCHO`

## Verificar que Todo Funciona

✅ El frontend carga correctamente
✅ Los productos se muestran en la página principal
✅ Puedes agregar productos al carrito
✅ El carrito se mantiene al recargar la página
✅ Puedes hacer checkout sin login
✅ Te redirige a MercadoPago
✅ Después del pago, vuelves al frontend

## Comandos Útiles de Vercel

**Ver deployments:**
```powershell
vercel ls
```

**Ver logs:**
```powershell
vercel logs
```

**Redeploy:**
```powershell
vercel --prod
```

**Ver variables:**
```powershell
vercel env ls
```

## Configurar Dominio Personalizado (Opcional)

1. En Vercel dashboard, ve a **Settings** → **Domains**
2. Click **Add Domain**
3. Ingresa tu dominio (ej: `tufarmacia.cl`)
4. Sigue las instrucciones para configurar DNS

## Troubleshooting

### "Failed to fetch products"
- Verifica que `NEXT_PUBLIC_PRODUCT_SERVICE_URL` esté correcta
- Verifica que product-service esté corriendo en Railway
- Verifica CORS en product-service (ya está configurado)

### "Checkout failed"
- Verifica que `NEXT_PUBLIC_ORDER_SERVICE_URL` esté correcta
- Verifica que order-service esté corriendo
- Revisa los logs de order-service en Railway

### "MercadoPago error"
- Verifica `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
- Asegúrate que coincida con el access token del backend
- Usa TEST keys para pruebas, producción para prod

### Las imágenes no cargan
- Las imágenes están configuradas en Next.js config
- Verifica que las URLs de imágenes en la base de datos sean válidas

## ✅ Deploy Completo

Tu aplicación Tu Farmacia ahora está completamente desplegada:

- **Frontend**: https://tu-farmacia.vercel.app
- **Backend**: Running on Railway
- **Database**: PostgreSQL en Railway
- **Cache**: Redis en Railway
- **Payments**: MercadoPago integrado

¡Felicidades! 🎉
