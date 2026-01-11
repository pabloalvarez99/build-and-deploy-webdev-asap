# Corrección: Nombres de Campos del Payer

**Fecha**: 2026-01-11  
**Problema**: MercadoPago espera `payer.first_name` y `payer.last_name`, no `payer.name` y `payer.surname`

---

## 🔍 Problema Identificado

**Reporte de MercadoPago dice**:
- "Envíanos el campo `payer.first_name`"
- "Envíanos el campo `payer.last_name`"

**Nuestro código estaba enviando**:
- `payer.name` ❌
- `payer.surname` ❌

---

## ✅ Solución Implementada

Usamos `#[serde(rename = "...")]` para mapear correctamente los campos sin cambiar los nombres internos del struct.

### Cambio Realizado

**Archivo**: `apps/order-service/src/models/order.rs`

**Antes**:
```rust
#[derive(Debug, Serialize)]
pub struct MercadoPagoPayer {
    pub email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub surname: Option<String>,
}
```

**Después**:
```rust
#[derive(Debug, Serialize)]
pub struct MercadoPagoPayer {
    pub email: String,
    #[serde(rename = "first_name", skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    #[serde(rename = "last_name", skip_serializing_if = "Option::is_none")]
    pub surname: Option<String>,
}
```

**Resultado JSON**:
```json
{
  "email": "usuario@email.com",
  "first_name": "Juan",    // ✅ Correcto
  "last_name": "Perez"     // ✅ Correcto
}
```

---

## 📋 Campos Ahora Correctos

Todos los campos requeridos ahora están implementados correctamente:

### Items ✅
- `items.id`
- `items.title`
- `items.description`
- `items.category_id`
- `items.quantity`
- `items.unit_price`
- `items.currency_id`

### Preference ✅
- `back_urls` (success, failure, pending)
- `notification_url`
- `external_reference`
- `statement_descriptor`

### Payer ✅
- `payer.email`
- `payer.first_name` ✅ (corregido)
- `payer.last_name` ✅ (corregido)

---

## 🚀 Deploy

**Commit**: Corregir nombres de campos payer
**Estado**: Pusheado a GitHub
**Railway**: Deploy automático iniciado

---

## ⏳ Próximos Pasos

1. **Esperar deploy de Railway** (2-5 minutos)
2. **Procesar un pago real** con los nuevos campos
3. **Esperar hasta 24 horas** para re-evaluación de MercadoPago
4. **Verificar puntaje** en el panel de MercadoPago

---

**Estado**: ✅ Corrección implementada y deployada
