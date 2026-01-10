# 🚀 Deploy Frontend a Vercel - AHORA

## Estado Actual
✅ Backend 100% funcional
✅ Base de datos poblada
✅ APIs respondiendo correctamente
✅ Vercel CLI instalado

## 📋 Variables de Entorno Ya Configuradas

He creado `.env.production` con:
```
✅ NEXT_PUBLIC_PRODUCT_SERVICE_URL
✅ NEXT_PUBLIC_ORDER_SERVICE_URL
✅ NEXT_PUBLIC_AUTH_SERVICE_URL
⚠️ NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY (necesitas tu key)
```

---

## 🎯 Deployment en 3 Pasos

### Paso 1: Login a Vercel

```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce\apps\web"
vercel login
```

Esto abrirá tu navegador. Completa el login.

### Paso 2: Deploy

```powershell
vercel
```

Cuando te pregunte:
- **Set up and deploy?** → `Y` (Yes)
- **Which scope?** → Selecciona tu cuenta
- **Link to existing project?** → `N` (No)
- **What's your project's name?** → `tu-farmacia`
- **In which directory is your code located?** → `.` (presiona Enter)
- **Want to modify the settings?** → `N` (No)

Vercel desplegará automáticamente.

### Paso 3: Configurar MercadoPago Key

Después del deploy:

1. Ve a https://vercel.com
2. Abre el proyecto `tu-farmacia`
3. Click en **Settings** → **Environment Variables**
4. Busca `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
5. Edita y pega tu MercadoPago Public Key
6. Click **Save**
7. Redeploy:
   ```powershell
   vercel --prod
   ```

---

## 🔑 Obtener MercadoPago Public Key

1. Ve a https://www.mercadopago.com.cl/developers/panel/app
2. Selecciona tu aplicación
3. Copia el **Public Key** (empieza con `TEST-` para pruebas)

---

## ✅ Verificación Final

Después del deploy:

1. Abre la URL de Vercel (ej: `https://tu-farmacia.vercel.app`)
2. Deberías ver:
   - ✅ Productos cargando
   - ✅ Categorías en el menú
   - ✅ Carrito funcional
   - ✅ Checkout sin login

3. Prueba agregar al carrito y hacer checkout

---

## 🆘 Si Algo Falla

**"Products not loading":**
- Verifica que las URLs de los servicios sean correctas
- Revisa la consola del navegador (F12)

**"Build failed":**
- Asegúrate de estar en el directorio correcto (`apps/web`)
- Verifica que `package.json` existe

**"MercadoPago error":**
- Asegúrate de usar el Public Key correcto
- Debe coincidir con el Access Token del backend

---

## 📊 Después del Deploy

Actualiza la URL del frontend en Railway:

1. Railway → **order-service** → **Variables**
2. Edita `FRONTEND_URL` con tu URL de Vercel:
   ```
   FRONTEND_URL=https://tu-farmacia.vercel.app
   ```

---

**Siguiente:** Ejecuta los comandos del Paso 1 y 2, luego avísame cuando esté desplegado.
