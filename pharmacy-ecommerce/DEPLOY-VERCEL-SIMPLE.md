# 🚀 Deploy Frontend - Comandos Simples

## ✅ Tu Backend Ya Está Funcionando

No necesitas hacer nada más con Railway. Todo funciona:
- ✅ APIs respondiendo
- ✅ Base de datos poblada
- ✅ Todos los servicios online

## 📝 Deploy Frontend (3 Comandos)

### Paso 1: Abrir PowerShell en el directorio correcto

```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce\apps\web"
```

### Paso 2: Login a Vercel

```powershell
vercel login
```

- Se abrirá tu navegador
- Haz login con tu cuenta
- Vuelve a PowerShell

### Paso 3: Deploy

```powershell
vercel --yes
```

El flag `--yes` acepta automáticamente todas las preguntas por defecto.

Vercel detectará Next.js automáticamente y desplegará.

### Paso 4: Deploy a Producción

```powershell
vercel --prod
```

---

## ⚠️ DESPUÉS del Deploy

### 1. Obtener MercadoPago Public Key

1. Ve a: https://www.mercadopago.com.cl/developers/panel/app
2. Selecciona tu app
3. Copia el **Public Key** (empieza con `TEST-`)

### 2. Agregar Variable en Vercel

1. Ve a: https://vercel.com
2. Abre proyecto `tu-farmacia`
3. Settings → Environment Variables
4. Click "Add New"
5. Name: `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
6. Value: Tu Public Key
7. Environments: Marca todas (Production, Preview, Development)
8. Save

### 3. Redeploy

```powershell
vercel --prod
```

---

## 🎉 ¡Listo!

Tu app estará en: `https://tu-farmacia-xxx.vercel.app`

Verifica:
- ✅ Productos se cargan
- ✅ Puedes agregar al carrito
- ✅ Carrito persiste al recargar
- ✅ Checkout funciona

---

## 🔧 Actualizar FRONTEND_URL en Railway (Opcional)

1. Ve a Railway Dashboard
2. Click en **order-service**
3. Variables tab
4. Edita `FRONTEND_URL` con tu URL de Vercel
5. Guarda (se redeployará automáticamente)

---

## Si Hay Errores

**Build Error:**
- Revisa que estés en el directorio correcto (`apps/web`)
- Asegúrate que `package.json` existe

**Products Not Loading:**
- Verifica las variables de entorno en Vercel dashboard
- Las URLs de los servicios deberían estar en `vercel.json` (ya creado)

**MercadoPago Error:**
- Asegúrate de usar el Public Key correcto
- Debe ser de la misma app que el Access Token del backend
