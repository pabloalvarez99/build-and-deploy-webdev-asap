# Cambios: Agregar name y surname al checkout para MercadoPago

**Fecha**: 2026-01-11  
**Objetivo**: Mejorar calidad de integración MercadoPago (39/100 → 73+)

---

## Cambios Implementados

### 1. Frontend - `apps/web/src/app/checkout/page.tsx`

**Agregado**:
- Campos de estado: `name` y `surname`
- Validación: Ambos campos son requeridos
- UI: Sección "Información personal" con campos Nombre y Apellido
- El botón de pago se deshabilita si faltan name, surname o email

**Ubicación de cambios**:
- Líneas 13-14: Estados agregados
- Líneas 26-35: Validación agregada
- Líneas 76-105: UI agregada (nueva sección antes del email)
- Línea 190: Validación del botón actualizada
- Línea 40-46: Datos enviados al backend

### 2. API TypeScript - `apps/web/src/lib/api.ts`

**Agregado**:
- `name: string` y `surname: string` al tipo de `guestCheckout`

**Ubicación**: Línea 151-162

### 3. Backend Models - `apps/order-service/src/models/order.rs`

**Agregado**:
- `pub name: String` y `pub surname: String` a `GuestCheckoutRequest`

**Ubicación**: Línea 52-58

### 4. Backend Handler - `apps/order-service/src/handlers/checkout.rs`

**Actualizado**:
- `payer.name` ahora usa `Some(payload.name.clone())`
- `payer.surname` ahora usa `Some(payload.surname.clone())`

**Ubicación**: Línea 458-462 (función `guest_checkout`)

---

## Archivos Modificados

1. ✅ `apps/web/src/app/checkout/page.tsx`
2. ✅ `apps/web/src/lib/api.ts`
3. ✅ `apps/order-service/src/models/order.rs`
4. ✅ `apps/order-service/src/handlers/checkout.rs`

---

## Próximos Pasos

1. **Deploy a Railway** (order-service):
   ```bash
   git add .
   git commit -m "Agregar campos name y surname al checkout para mejorar calidad MercadoPago"
   git push origin main
   ```

2. **Deploy a Vercel** (frontend):
   ```bash
   cd apps/web
   vercel --prod
   ```

3. **Verificar calidad de integración**:
   - Esperar 24 horas después del deploy
   - Revisar: https://www.mercadopago.com.cl/developers/panel/app/4790563553663084/integration-quality
   - El puntaje debería subir de 39/100 a 73+/100

4. **Probar checkout**:
   - Ir a https://tu-farmacia.vercel.app
   - Agregar productos al carrito
   - Proceder al checkout
   - Verificar que se piden nombre y apellido
   - Completar el pago y verificar que funcione

---

## Nota sobre Checkout Autenticado

El checkout autenticado (`/api/checkout`) NO fue modificado porque:
- Usa un flujo diferente (pago directo con token de tarjeta)
- Ya obtiene la información del usuario autenticado de la base de datos
- No usa preferencias de MercadoPago (usa `create_payment` directamente)
- El `PayerInfo` ya incluye la información necesaria

---

## Campos Ahora Enviados a MercadoPago

### Items (ya estaban):
- ✅ `id` (UUID del producto)
- ✅ `title` (nombre del producto)
- ✅ `description` (descripción)
- ✅ `category_id` (ID de categoría)
- ✅ `quantity`
- ✅ `unit_price`
- ✅ `currency_id` ("CLP")

### Payer (NUEVO):
- ✅ `email` (ya estaba)
- ✅ `name` (NUEVO)
- ✅ `surname` (NUEVO)

### Preference (ya estaba):
- ✅ `statement_descriptor` ("Tu Farmacia")
- ✅ `back_urls`
- ✅ `notification_url`
- ✅ `external_reference`

---

**Estado**: ✅ Cambios completados y listos para deploy
