# 🚀 Configuración de Producción - MercadoPago

## ✅ Credenciales de Producción

**Aplicación MercadoPago:**
- **N° de Aplicación**: 4790563553663084
- **User ID**: 170193821

**Credenciales (PRODUCCIÓN):**
- **Public Key**: `APP_USR-4bcad89a-4085-4e91-b547-5d53693895d4`
- **Access Token**: `APP_USR-4790563553663084-010811-588bd914effd0972900f06380fc851d2-170193821`

---

## 📋 Variables Configuradas en Railway

### Servicio: `build-and-deploy-webdev-asap` (order-service)

```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-4790563553663084-010811-588bd914effd0972900f06380fc851d2-170193821
FRONTEND_URL=https://tu-farmacia.vercel.app
WEBHOOK_URL=https://build-and-deploy-webdev-asap-production.up.railway.app/api/webhook/mercadopago
PORT=3003
DATABASE_URL=postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway
REDIS_URL=redis://default:lAgeHtiUTWnpraEoMyovuHlnRePhWuhU@centerbeam.proxy.rlwy.net:21710
```

---

## 🧪 Cómo Probar Pagos Reales

### 1. Accede a tu tienda
https://tu-farmacia.vercel.app

### 2. Agrega productos al carrito
- Navega por los productos
- Click en "Agregar al carrito"
- Ve al carrito (icono arriba derecha)

### 3. Completa el checkout
- Click en "Proceder al pago"
- Ingresa tu email
- Opcionalmente: dirección de envío o escribe "Retiro en tienda"
- Click en "Pagar con MercadoPago"

### 4. Completa el pago
- Serás redirigido a MercadoPago
- **Inicia sesión con tu cuenta real de MercadoPago**
- Selecciona tu método de pago (tarjeta guardada, nueva tarjeta, etc.)
- Completa el pago

### 5. Confirmación
- Después del pago exitoso, serás redirigido a `/checkout/success`
- Recibirás un email de confirmación
- El webhook actualizará automáticamente el estado de la orden en la base de datos

---

## 🔄 Flujo de Webhook

Cuando un cliente paga:

1. **Cliente completa pago** en MercadoPago
2. **MercadoPago envía webhook** a:
   ```
   POST https://build-and-deploy-webdev-asap-production.up.railway.app/api/webhook/mercadopago
   ```
3. **Backend actualiza orden** en PostgreSQL con:
   - Estado del pago (approved, pending, rejected)
   - ID de pago de MercadoPago
   - Información del comprador

4. **Cliente es redirigido** a:
   - `/checkout/success` si aprobado
   - `/checkout/failure` si rechazado
   - `/checkout/pending` si pendiente

---

## 📊 Monitoreo de Pagos

### Ver Órdenes en Base de Datos

Conéctate a PostgreSQL via Railway:
```sql
-- Ver últimas órdenes
SELECT
    id,
    guest_email,
    status,
    total,
    mercadopago_payment_id,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- Ver items de una orden específica
SELECT
    oi.product_name,
    oi.quantity,
    oi.price_at_purchase,
    (oi.quantity * oi.price_at_purchase::numeric) as subtotal
FROM order_items oi
WHERE oi.order_id = 'ORDER_ID_AQUI';
```

### Panel de MercadoPago

Ver todas tus transacciones en:
https://www.mercadopago.com.cl/activities

---

## 🛒 Retiro en Tienda

Los clientes pueden indicar "Retiro en tienda" de dos formas:

### Opción 1: En la dirección
- Campo "Dirección de envío"
- Escribir: "Retiro en tienda"

### Opción 2: En notas
- Campo "Notas adicionales"
- Escribir: "Prefiero retiro en tienda"

Luego puedes filtrar órdenes con estas palabras clave en la base de datos:
```sql
SELECT *
FROM orders
WHERE shipping_address ILIKE '%retiro en tienda%'
   OR notes ILIKE '%retiro en tienda%'
ORDER BY created_at DESC;
```

---

## ⚠️ Importante

### Modo Producción Activado ✅

- Las credenciales configuradas son de **PRODUCCIÓN**
- Los pagos serán **REALES** y se depositarán en tu cuenta de MercadoPago
- Los clientes pagarán con dinero real
- Recibirás el dinero menos la comisión de MercadoPago

### Comisiones de MercadoPago

- Verifica las comisiones en: https://www.mercadopago.com.cl/costs-section/release-costs
- Típicamente: ~3-4% + comisión fija por transacción

### Seguridad

- Las URLs del backend (Railway) están ocultas gracias al API Gateway
- Todas las transacciones pasan por HTTPS
- Los webhooks validan que vengan de MercadoPago

---

## 📞 URLs Importantes

- **Tienda**: https://tu-farmacia.vercel.app
- **Railway Dashboard**: https://railway.app/project/f9fb341e-dfa9-4e46-aefa-b4fd9115c86d
- **Vercel Dashboard**: https://vercel.com/pablo-figueroas-projects-015bb2fb/tu-farmacia
- **MercadoPago Panel**: https://www.mercadopago.com.cl/developers/panel/app

---

## ✅ Checklist de Producción

- [x] Backend desplegado en Railway
- [x] Frontend desplegado en Vercel
- [x] Base de datos con productos
- [x] Credenciales de MercadoPago configuradas (PRODUCCIÓN)
- [x] Webhook configurado
- [x] API Gateway funcionando
- [ ] **Probar pago real** (próximo paso)
- [ ] Configurar dominio personalizado (opcional)
- [ ] Agregar más productos (opcional)

---

**Estado**: ✅ LISTO PARA RECIBIR PAGOS REALES

**Fecha de configuración**: 11 de enero de 2026
