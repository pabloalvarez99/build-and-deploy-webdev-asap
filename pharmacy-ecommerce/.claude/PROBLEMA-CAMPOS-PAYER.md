# Problema: Nombres de Campos del Payer

**Fecha**: 2026-01-11  
**Problema identificado**: Discrepancia en nombres de campos

---

## 🔍 Problema Identificado

MercadoPago reporta que necesitamos:
- `payer.first_name` 
- `payer.last_name`

Pero nuestro código está enviando:
- `payer.name`
- `payer.surname`

---

## 📋 Análisis del Reporte de Calidad

**Puntaje actual**: 39/100 (requerido: 73/100)  
**Última medición**: 11/01/2026 19:36:13

### Acciones Pendientes Reportadas

**Aprobación de pagos**:
- ⚠️ "Nombre del comprador" - Envíanos el campo `payer.first_name`
- ⚠️ "Apellido del comprador" - Envíanos el campo `payer.last_name`

**Nota**: El reporte específicamente menciona `payer.first_name` y `payer.last_name`, NO `payer.name` y `payer.surname`.

---

## ✅ Campos que Ya Tenemos (Correctos)

Todos estos ya están implementados:
- ✅ `items.id`
- ✅ `items.title`
- ✅ `items.description`
- ✅ `items.category_id`
- ✅ `items.quantity`
- ✅ `items.unit_price`
- ✅ `back_urls`
- ✅ `notification_url`
- ✅ `external_reference`
- ✅ `statement_descriptor`
- ✅ `payer.email`

---

## ❌ Problema: Nombres de Campos del Payer

### Código Actual

```rust
pub struct MercadoPagoPayer {
    pub email: String,
    pub name: Option<String>,      // ⚠️ Debería ser "first_name"
    pub surname: Option<String>,   // ⚠️ Debería ser "last_name"
}
```

### Lo que MercadoPago Espera

Según el reporte:
- `payer.first_name` (no `payer.name`)
- `payer.last_name` (no `payer.surname`)

---

## 🔧 Solución: Cambiar Nombres de Campos

Necesitamos usar `#[serde(rename = "...")]` para mapear nuestros campos a los nombres que MercadoPago espera.

### Cambio Necesario

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

O mejor aún, renombrar los campos en el struct:

```rust
#[derive(Debug, Serialize)]
pub struct MercadoPagoPayer {
    pub email: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub first_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_name: Option<String>,
}
```

Y actualizar el código que usa estos campos.

---

## 📝 Nota Importante

**Antes de cambiar**: Verificar la documentación oficial de MercadoPago para confirmar los nombres exactos de los campos. Es posible que acepten ambos formatos, pero el reporte sugiere que prefieren `first_name` y `last_name`.

---

**Estado**: Pendiente verificación y corrección
