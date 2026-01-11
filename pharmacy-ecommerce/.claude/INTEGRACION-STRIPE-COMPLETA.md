# Integración Stripe - COMPLETA ✅

**Fecha**: 2026-01-11  
**Estado**: Implementación backend y frontend completada

---

## ✅ Cambios Realizados

### Backend (Rust)

#### 1. Migración de Base de Datos ✅
- **Archivo**: `database/migrations/003_stripe_integration.sql`
- **Cambios**:
  - Agregado campo `payment_provider` (VARCHAR, default: 'mercadopago')
  - Agregado campo `stripe_checkout_session_id` (VARCHAR)
  - Agregado campo `stripe_payment_intent_id` (VARCHAR)
  - Índices creados para optimización

#### 2. Modelos ✅
- **Archivo**: `apps/order-service/src/models/order.rs`
- **Cambios**:
  - Actualizado struct `Order` con campos Stripe
  - Agregado `payment_method` opcional a `GuestCheckoutRequest`
  - Agregados structs para Stripe:
    - `StripeCheckoutSessionCreate`
    - `StripeLineItem`
    - `StripeCheckoutSessionResponse`
    - `StripeCheckoutSession`
    - `StripePaymentIntent`
    - `StripeWebhookEvent` y relacionados

#### 3. Servicio Stripe ✅
- **Archivo**: `apps/order-service/src/services/stripe.rs`
- **Funciones**:
  - `create_checkout_session()` - Crea sesión de checkout en Stripe
  - `get_checkout_session()` - Obtiene sesión de checkout
  - `construct_webhook_event()` - Parsea eventos de webhook

#### 4. Configuración ✅
- **Archivo**: `apps/order-service/src/config.rs`
- **Cambios**:
  - Agregado `stripe_secret_key` (opcional, puede estar vacío)
  - Agregado `stripe_webhook_secret` (opcional)

#### 5. Handler de Checkout ✅
- **Archivo**: `apps/order-service/src/handlers/checkout.rs`
- **Cambios**:
  - Modificado `guest_checkout()` para soportar ambos métodos
  - Lógica condicional: MercadoPago (default) o Stripe
  - Actualizado INSERT de orders para incluir `payment_provider`

#### 6. Webhook Handler ✅
- **Archivo**: `apps/order-service/src/handlers/webhook.rs`
- **Funciones**:
  - `stripe_webhook()` - Procesa eventos de Stripe
  - Maneja evento `checkout.session.completed`
  - Actualiza estado de orden y reduce stock

#### 7. Rutas ✅
- **Archivo**: `apps/order-service/src/main.rs`
- **Cambios**:
  - Agregada ruta `/api/webhook/stripe`

---

### Frontend (Next.js/TypeScript)

#### 1. API Client ✅
- **Archivo**: `apps/web/src/lib/api.ts`
- **Cambios**:
  - Agregado campo opcional `payment_method` a `guestCheckout()`

#### 2. Página de Checkout ✅
- **Archivo**: `apps/web/src/app/checkout/page.tsx`
- **Cambios**:
  - Agregado estado `paymentMethod` ('mercadopago' | 'stripe')
  - Agregados radio buttons para seleccionar método
  - Actualizado `handleCheckout()` para enviar método seleccionado
  - Actualizado texto del botón según método seleccionado

---

## 📋 Pendiente (Configuración Manual)

### 1. Ejecutar Migración de Base de Datos ⏳

**Archivo**: `database/migrations/003_stripe_integration.sql`

**Pasos**:
1. Ir a Railway Dashboard → PostgreSQL → Data → Query
2. Copiar contenido de `003_stripe_integration.sql`
3. Ejecutar query

### 2. Configurar Variables de Entorno en Railway ⏳

**Servicio**: order-service

**Variables necesarias**:
```bash
STRIPE_SECRET_KEY=sk_test_...  # O sk_live_... para producción
STRIPE_WEBHOOK_SECRET=whsec_...  # Secret del webhook (opcional, para verificación)
```

**Pasos**:
1. Railway Dashboard → order-service → Variables
2. Agregar `STRIPE_SECRET_KEY` (obtener de Stripe Dashboard)
3. (Opcional) Agregar `STRIPE_WEBHOOK_SECRET` si se quiere verificar webhooks

### 3. Configurar Webhook en Stripe ⏳

**Pasos**:
1. Ir a Stripe Dashboard → Developers → Webhooks
2. Agregar endpoint: `https://[tu-url-railway]/api/webhook/stripe`
3. Seleccionar evento: `checkout.session.completed`
4. Copiar "Signing secret" (empezará con `whsec_`)
5. Agregar como variable `STRIPE_WEBHOOK_SECRET` en Railway (opcional)

### 4. Deploy ⏳

**Backend**:
- Push a GitHub (si está configurado auto-deploy)
- O redeploy manual en Railway

**Frontend**:
- Push a GitHub (si está configurado auto-deploy)
- O redeploy manual en Vercel

---

## 🧪 Testing

### Test Manual

1. **Probar checkout con MercadoPago**:
   - Seleccionar "MercadoPago" en checkout
   - Completar formulario
   - Verificar redirección a MercadoPago

2. **Probar checkout con Stripe**:
   - Seleccionar "Stripe" en checkout
   - Completar formulario
   - Verificar redirección a Stripe

3. **Probar webhook de Stripe**:
   - Completar pago en Stripe
   - Verificar logs en Railway
   - Verificar que orden se actualiza en base de datos

---

## 📝 Notas Técnicas

### Stripe Checkout Session

- Stripe usa form-urlencoded para crear checkout sessions
- Los line_items se construyen manualmente con índices
- Currency: "clp" (Chilean Peso)
- Amounts: en centavos (ya convertidos desde CLP)

### Webhook

- Stripe envía eventos como JSON
- Evento principal: `checkout.session.completed`
- El `client_reference_id` contiene el `order_id`
- Verificación de firma no implementada (opcional)

### Base de Datos

- Campo `payment_provider` puede ser: 'mercadopago' | 'stripe'
- Default: 'mercadopago' (retrocompatibilidad)
- Campos Stripe son opcionales (NULL si no se usa Stripe)

---

## ✅ Checklist Final

- [x] Migración DB creada
- [x] Modelos Stripe creados
- [x] Servicio Stripe implementado
- [x] Handler checkout actualizado
- [x] Webhook handler creado
- [x] Rutas configuradas
- [x] Frontend actualizado
- [ ] Migración ejecutada
- [ ] Variables de entorno configuradas
- [ ] Webhook configurado en Stripe
- [ ] Deploy realizado
- [ ] Testing completado

---

**Última actualización**: 2026-01-11
