# Plan de Integración: Stripe Payment Gateway

**Fecha**: 2026-01-11  
**Objetivo**: Agregar Stripe como método de pago alternativo a MercadoPago

---

## 🎯 Objetivo

Permitir que los clientes elijan entre **MercadoPago** y **Stripe** como método de pago.

---

## 📋 Arquitectura Propuesta

### Opción 1: Elegir Método de Pago en Frontend (RECOMENDADO)

**Flujo**:
1. Usuario completa checkout (nombre, apellido, email)
2. Frontend muestra opciones: "Pagar con MercadoPago" o "Pagar con Stripe"
3. Usuario selecciona método
4. Backend procesa según método seleccionado

**Ventajas**:
- ✅ El usuario elige su método preferido
- ✅ No requiere cambios grandes en backend
- ✅ Fácil de implementar

### Opción 2: Ambos Métodos Simultáneos

Mostrar ambos botones y el usuario elige.

---

## 🔧 Cambios Necesarios

### Backend (Rust)

#### 1. Agregar Dependencias
```toml
# Cargo.toml
[dependencies]
stripe = "0.28"
# O usar reqwest + serde para llamadas HTTP directas
```

#### 2. Crear Servicio Stripe
- `apps/order-service/src/services/stripe.rs`
- Similar a `mercadopago.rs`
- Funciones: crear payment intent, verificar webhook

#### 3. Agregar Modelos
- `apps/order-service/src/models/order.rs`
- Structs para requests/responses de Stripe
- Actualizar `GuestCheckoutRequest` para incluir `payment_method`

#### 4. Crear Handlers
- `apps/order-service/src/handlers/stripe.rs` (o agregar a checkout.rs)
- Endpoint: `/api/stripe-checkout`
- Webhook: `/api/webhook/stripe`

#### 5. Actualizar Base de Datos
- Agregar campo `payment_provider` a tabla `orders`
- Valores: "mercadopago" | "stripe"
- Agregar campos específicos de Stripe si necesario

### Frontend (Next.js/TypeScript)

#### 1. Agregar Selección de Método de Pago
- `apps/web/src/app/checkout/page.tsx`
- Mostrar botones: "Pagar con MercadoPago" y "Pagar con Stripe"
- Estado para método seleccionado

#### 2. Crear API Client para Stripe
- `apps/web/src/lib/api.ts`
- Función `stripeCheckout()`

#### 3. Integrar Stripe Elements (Opcional)
- Si usar Stripe Checkout, redirección similar a MercadoPago
- Si usar Stripe Elements, embed en la página

---

## 📦 Estructura de Archivos

```
apps/order-service/src/
├── services/
│   ├── mercadopago.rs  (existente)
│   └── stripe.rs       (nuevo)
├── handlers/
│   ├── checkout.rs     (modificar)
│   └── stripe.rs       (nuevo, opcional)
└── models/
    └── order.rs        (modificar)

apps/web/src/
├── app/
│   └── checkout/
│       └── page.tsx    (modificar)
└── lib/
    └── api.ts          (modificar)
```

---

## 🔑 Variables de Entorno Necesarias

### Railway - Order Service

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...  # Test o sk_live_... para producción
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Para frontend
STRIPE_WEBHOOK_SECRET=whsec_...

# Mantener MercadoPago
MERCADOPAGO_ACCESS_TOKEN=...
```

### Vercel - Frontend (si usar Stripe Elements)

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## 🚀 Plan de Implementación

### Fase 1: Backend - Servicio Stripe (30 min)
1. Agregar dependencia `stripe` a Cargo.toml
2. Crear `services/stripe.rs`
3. Implementar funciones básicas (crear payment intent)

### Fase 2: Backend - Handlers (45 min)
1. Crear endpoint `/api/stripe-checkout`
2. Crear webhook handler `/api/webhook/stripe`
3. Agregar campo `payment_provider` a base de datos

### Fase 3: Frontend - UI (30 min)
1. Agregar selección de método de pago en checkout
2. Crear función API para Stripe
3. Implementar flujo de pago Stripe

### Fase 4: Testing (30 min)
1. Probar checkout con Stripe
2. Probar webhook de Stripe
3. Verificar que ambos métodos funcionan

**Tiempo total estimado**: ~2.5 horas

---

## 📝 Consideraciones

### Método de Integración Stripe

**Opción A: Stripe Checkout** (Más fácil, RECOMENDADO)
- Similar a MercadoPago
- Redirección a Stripe
- No requiere Stripe Elements
- Más rápido de implementar

**Opción B: Stripe Elements**
- Embed en la página
- Más control sobre UI
- Requiere más código frontend

### Base de Datos

Necesitamos agregar:
- Campo `payment_provider` (VARCHAR) a tabla `orders`
- Campo `stripe_payment_intent_id` (VARCHAR, nullable)
- Mantener campos de MercadoPago existentes

---

## ✅ Checklist de Implementación

### Backend
- [ ] Agregar dependencia stripe a Cargo.toml
- [ ] Crear servicio stripe.rs
- [ ] Agregar modelos para Stripe
- [ ] Crear handler stripe-checkout
- [ ] Crear webhook handler stripe
- [ ] Migración DB: agregar payment_provider
- [ ] Agregar variables de entorno

### Frontend
- [ ] Agregar selección de método de pago
- [ ] Crear función API stripeCheckout
- [ ] Implementar flujo de pago Stripe
- [ ] Agregar variables de entorno (si necesario)

### Testing
- [ ] Probar checkout con Stripe
- [ ] Probar webhook
- [ ] Verificar que ambos métodos funcionan

---

**Estado**: Plan creado, listo para implementar
