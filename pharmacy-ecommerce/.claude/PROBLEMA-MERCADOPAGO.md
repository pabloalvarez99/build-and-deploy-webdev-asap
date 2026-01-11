# Problema: Botón de Pago Deshabilitado en MercadoPago

**Fecha de inicio**: 2026-01-11
**Estado**: En investigación
**Prioridad**: Alta (bloqueante para producción)

---

## Síntoma

Cuando un usuario intenta pagar con su **cuenta personal de MercadoPago**, el **botón "Pagar" aparece deshabilitado** en la interfaz de checkout de MercadoPago.

**Escenario**:
1. Usuario agrega productos al carrito en https://tu-farmacia.vercel.app
2. Usuario procede al checkout
3. Ingresa email y datos de envío
4. Click en "Pagar con MercadoPago"
5. Es redirigido a MercadoPago
6. Botón "Pagar" aparece deshabilitado ❌

---

## Cronología del Problema

### 2026-01-11 (Mañana) - Identificación del Problema

**Observación inicial**:
- Usuario reporta que no puede completar pagos con cuenta personal
- Solo funcionaba con tarjetas de prueba

**Diagnóstico**:
- Error en panel de MercadoPago: **"Calidad de integración: 39 de 100"**
- Mínimo requerido: **73 de 100**
- Causa: Campos faltantes en la creación de preferencias de pago

### 2026-01-11 (Mediodía) - Intento de Solución #1

**Reporte de calidad de MercadoPago identificó campos faltantes**:

**Acciones obligatorias (missing)**:
- ❌ `items.quantity` - **YA ESTABA** ✅
- ❌ `items.unit_price` - **YA ESTABA** ✅
- ❌ `items.description` - **FALTABA**
- ❌ `items.category_id` - **FALTABA**
- ❌ `items.id` - **FALTABA**
- ❌ `payer.email` - **FALTABA**
- ❌ `statement_descriptor` - **FALTABA**

**Acciones recomendadas**:
- ⚠️ `payer.first_name` - **AÚN FALTA**
- ⚠️ `payer.last_name` - **AÚN FALTA**

**Implementación**:
1. Modificado `apps/order-service/src/models/order.rs`:
   - Agregado `id`, `description`, `category_id` a `MercadoPagoItem`
   - Agregado `payer` y `statement_descriptor` a `MercadoPagoPreference`
   - Creado struct `MercadoPagoPayer` con email, name (opt), surname (opt)

2. Modificado `apps/order-service/src/handlers/checkout.rs`:
   - Query SQL actualizada para obtener `description` y `category_id` de productos
   - Items de MercadoPago ahora incluyen todos los campos requeridos
   - Preferencia de MercadoPago incluye payer email y statement_descriptor

3. Commiteado: `7028c618`

4. Deployado a Railway: **✅ EXITOSO**

**Resultado**: Botón sigue deshabilitado ❌

---

## Posibles Causas

### 1. MercadoPago necesita tiempo para re-evaluar (MÁS PROBABLE)

**Explicación**:
- El puntaje de calidad de integración de MercadoPago **no se actualiza instantáneamente**
- Según documentación de MercadoPago, puede tardar **hasta 24 horas** en re-evaluar después de cambios en la integración
- Últimos cambios fueron deployados el 2026-01-11 ~15:00

**Verificación**:
- Ir a: https://www.mercadopago.com.cl/developers/panel/app/4790563553663084/integration-quality
- Revisar si el puntaje subió de 39/100
- Si sigue en 39/100, esperar 24 horas

**Acción**:
- ⏳ Esperar hasta 2026-01-12 ~15:00
- Verificar puntaje nuevamente
- Si sube a 73+, problema resuelto
- Si no sube, pasar a causa #2

---

### 2. Faltan campos adicionales del payer

**Explicación**:
- Actualmente enviamos solo `payer.email`
- MercadoPago recomienda también enviar `payer.first_name` y `payer.last_name`
- El frontend de checkout **NO pide nombre/apellido** del usuario actualmente

**Evidencia**:
- Reporte de calidad muestra estas como "Acciones recomendadas" (no obligatorias)
- Pero podrían ser requeridas para llegar a 73/100

**Solución propuesta**:
1. **Frontend** (`apps/web/src/app/checkout/page.tsx`):
   - Agregar campos de input:
     - "Nombre"
     - "Apellido"
   - Validar que no estén vacíos

2. **Backend Models** (`apps/order-service/src/models/order.rs`):
   ```rust
   pub struct GuestCheckoutRequest {
       pub items: Vec<GuestCheckoutItem>,
       pub email: String,
       pub name: String,           // NUEVO
       pub surname: String,         // NUEVO
       pub shipping_address: Option<String>,
       pub notes: Option<String>,
       pub session_id: String,
   }
   ```

3. **Backend Handler** (`apps/order-service/src/handlers/checkout.rs`):
   ```rust
   payer: Some(MercadoPagoPayer {
       email: payload.email.clone(),
       name: Some(payload.name.clone()),      // NUEVO
       surname: Some(payload.surname.clone()), // NUEVO
   }),
   ```

**Tiempo estimado**: 30-45 minutos

**Archivos a modificar**:
- `apps/web/src/app/checkout/page.tsx`
- `apps/order-service/src/models/order.rs`
- `apps/order-service/src/handlers/checkout.rs`

---

### 3. Cuenta personal vs cuenta de prueba

**Explicación**:
- MercadoPago diferencia entre:
  - **Modo Test**: Solo acepta tarjetas de prueba
  - **Modo Producción**: Acepta tarjetas reales
- La aplicación actual usa **credenciales de producción**
- Sin embargo, podría requerir **verificación o aprobación** de MercadoPago para cuentas personales

**Verificación**:
- Panel MercadoPago: https://www.mercadopago.com.cl/developers/panel/app/4790563553663084
- Verificar estado de la aplicación:
  - ¿Dice "En producción" o "En revisión"?
  - ¿Hay algún mensaje de verificación pendiente?

**Workaround temporal**:
- Usar tarjetas de prueba de MercadoPago:
  - Número: `5416 7526 0258 2580`
  - Nombre: `APRO`
  - Vencimiento: `11/30`
  - CVV: `123`
  - DNI: `11111111`

---

### 4. Webhook URL o back_urls incorrectas

**Verificación actual**:
```bash
# Configuradas en Railway (Order Service)
WEBHOOK_URL=https://build-and-deploy-webdev-asap-production.up.railway.app/api/webhook/mercadopago
FRONTEND_URL=https://tu-farmacia.vercel.app

# En el código (checkout.rs):
back_urls:
  success: https://tu-farmacia.vercel.app/checkout/success?order_id={id}
  failure: https://tu-farmacia.vercel.app/checkout/failure?order_id={id}
  pending: https://tu-farmacia.vercel.app/checkout/pending?order_id={id}

notification_url: https://build-and-deploy-webdev-asap-production.up.railway.app/api/webhook/mercadopago
```

**Status**: ✅ URLs configuradas correctamente

**Test de webhook**:
```bash
# Verificar que el endpoint esté accesible
curl https://build-and-deploy-webdev-asap-production.up.railway.app/api/webhook/mercadopago
# Debería retornar 405 Method Not Allowed (porque es POST)
```

---

### 5. Error en la estructura de items o preference

**Verificación**:
- Revisar logs de Railway para errores al crear preferencia
- Ver respuesta de API de MercadoPago

**Comando**:
```bash
railway logs --service build-and-deploy-webdev-asap --tail 100
```

**Buscar**:
- "MercadoPago error"
- "Parse error"
- Status codes 4xx o 5xx de MercadoPago API

---

## Próximos Pasos de Troubleshooting

### Paso 1: Verificar puntaje de calidad (2 minutos) ⏱️

```bash
# Abrir en navegador
https://www.mercadopago.com.cl/developers/panel/app/4790563553663084/integration-quality
```

**Checklist**:
- [ ] ¿El puntaje subió de 39/100?
- [ ] Si es ≥73/100, intentar pago nuevamente
- [ ] Si sigue en 39/100, continuar con Paso 2

---

### Paso 2: Agregar nombre/apellido al checkout (30-45 minutos) ⏱️

**Solo si Paso 1 no resuelve el problema**.

1. **Modificar frontend** - Agregar campos nombre/apellido
2. **Modificar backend models** - Agregar name, surname a GuestCheckoutRequest
3. **Modificar backend handler** - Pasar name, surname a MercadoPagoPayer
4. **Deploy a Railway + Vercel**
5. **Probar checkout nuevamente**

Ver sección "Causa #2" arriba para detalles de implementación.

---

### Paso 3: Revisar logs de Railway (5 minutos) ⏱️

```bash
railway login
railway link f9fb341e-dfa9-4e46-aefa-b4fd9115c86d
railway logs --service build-and-deploy-webdev-asap --tail 200
```

**Buscar**:
- Errores al crear preferencia de MercadoPago
- Respuestas de API con status 4xx o 5xx
- "MercadoPago error"
- "Parse error"

---

### Paso 4: Probar con tarjeta de prueba (5 minutos) ⏱️

**Solo para verificar que el flujo funciona**.

1. Ir a https://tu-farmacia.vercel.app
2. Agregar productos al carrito
3. Proceder al checkout
4. En MercadoPago, usar datos de prueba:
   - Número: `5416 7526 0258 2580`
   - Nombre: `APRO`
   - Vencimiento: `11/30`
   - CVV: `123`
   - DNI: `11111111`

**Si funciona con tarjeta de prueba**:
- ✅ Confirma que el código está correcto
- ✅ Confirma que es problema de calidad de integración para cuentas reales
- → Volver a Paso 1 o Paso 2

---

### Paso 5: Contactar soporte MercadoPago (si todo lo anterior falla)

**Información a proveer**:
- Application ID: `4790563553663084`
- User ID: `170193821`
- Problema: "Botón de pago deshabilitado para cuentas personales"
- Puntaje de calidad actual
- Campos enviados en la preferencia (mostrar JSON de ejemplo)
- Logs de la API de MercadoPago

**Contacto**:
- https://www.mercadopago.com.cl/developers/es/support/center

---

## Código Relevante

### MercadoPagoPreference (apps/order-service/src/models/order.rs:85-107)

```rust
#[derive(Debug, Serialize)]
pub struct MercadoPagoPreference {
    pub items: Vec<MercadoPagoItem>,
    pub back_urls: MercadoPagoBackUrls,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auto_return: Option<String>,
    pub external_reference: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notification_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payer: Option<MercadoPagoPayer>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub statement_descriptor: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct MercadoPagoPayer {
    pub email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub surname: Option<String>,
}
```

### MercadoPagoItem (apps/order-service/src/models/order.rs:109-117)

```rust
#[derive(Debug, Serialize)]
pub struct MercadoPagoItem {
    pub id: String,
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category_id: Option<String>,
    pub quantity: i32,
    pub unit_price: i64,
    pub currency_id: String,
}
```

### Guest Checkout Handler (apps/order-service/src/handlers/checkout.rs:427-455)

```rust
let preference = MercadoPagoPreference {
    items: mp_items,
    back_urls: MercadoPagoBackUrls {
        success: format!(
            "{}/checkout/success?order_id={}",
            state.config.frontend_url, order_id
        ),
        failure: format!(
            "{}/checkout/failure?order_id={}",
            state.config.frontend_url, order_id
        ),
        pending: format!(
            "{}/checkout/pending?order_id={}",
            state.config.frontend_url, order_id
        ),
    },
    auto_return,
    external_reference: order_id.to_string(),
    notification_url: Some(format!(
        "{}/api/webhook/mercadopago",
        state.config.webhook_url
    )),
    payer: Some(MercadoPagoPayer {
        email: payload.email.clone(),
        name: None,  // ⚠️ ACTUALMENTE None
        surname: None,  // ⚠️ ACTUALMENTE None
    }),
    statement_descriptor: Some("Tu Farmacia".to_string()),
};
```

---

## Documentación de MercadoPago

### Integration Quality
- https://www.mercadopago.com.cl/developers/es/docs/checkout-pro/integration-quality

### Required Fields
- https://www.mercadopago.com.cl/developers/es/docs/checkout-pro/integration-configuration

### Checkout Pro
- https://www.mercadopago.com.cl/developers/es/docs/checkout-pro/landing

---

## Notas Adicionales

- **No modificar `MERCADOPAGO_ACCESS_TOKEN`** - Ya está configurado para producción
- **No usar credenciales de test** - Ya están en modo producción
- **Revisar panel de MercadoPago diariamente** - Para ver si se actualiza el puntaje
- **Guardar screenshots del error** - Para soporte de MercadoPago si es necesario

---

**Última actualización**: 2026-01-11
**Próxima acción sugerida**: Verificar puntaje de calidad mañana (2026-01-12)
**Responsable**: A definir
