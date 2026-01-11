# Análisis del Reporte de Calidad MercadoPago

**Fecha**: 2026-01-11  
**Puntaje**: 39/100 (requerido: 73/100)  
**Última medición**: 11/01/2026 19:36:13  
**Payment ID usado**: 140554785149

---

## 🔍 Análisis por Categoría

### Experiencia de Compra (3 acciones pendientes)

**Reportado como pendiente**:
1. ⚠️ `items.quantity` - **YA TENEMOS** ✅ (línea 384)
2. ⚠️ `items.unit_price` - **YA TENEMOS** ✅ (línea 385)
3. ⚠️ Back URLs - **YA TENEMOS** ✅ (líneas 438-450)
4. ⚠️ `statement_descriptor` - **YA TENEMOS** ✅ (línea 463)

### Conciliación Financiera (2 acciones pendientes)

**Reportado como obligatorio**:
1. ❌ `notification_url` - **YA TENEMOS** ✅ (líneas 454-456)
2. ❌ `external_reference` - **YA TENEMOS** ✅ (línea 453)

### Aprobación de Pagos (4 acciones pendientes)

**Reportado como pendiente**:
1. ⚠️ `items.category_id` - **YA TENEMOS** ✅ (línea 383)
2. ⚠️ `items.description` - **YA TENEMOS** ✅ (línea 382)
3. ⚠️ `items.id` - **YA TENEMOS** ✅ (línea 380)
4. ⚠️ `items.title` - **YA TENEMOS** ✅ (línea 381)
5. ❌ `payer.email` - **YA TENEMOS** ✅ (línea 459) - OBLIGATORIO
6. ⚠️ `payer.first_name` - **TENEMOS PERO CON NOMBRE DIFERENTE** ⚠️
7. ⚠️ `payer.last_name` - **TENEMOS PERO CON NOMBRE DIFERENTE** ⚠️

---

## ⚠️ Problema Potencial: Nombres de Campos del Payer

### Código Actual

```rust
pub struct MercadoPagoPayer {
    pub email: String,
    pub name: Option<String>,      // ⚠️ MercadoPago espera "first_name"
    pub surname: Option<String>,   // ⚠️ MercadoPago espera "last_name"
}
```

**Serialización JSON actual**:
```json
{
  "email": "usuario@email.com",
  "name": "Juan",        // ⚠️ Debería ser "first_name"
  "surname": "Perez"     // ⚠️ Debería ser "last_name"
}
```

**Lo que MercadoPago espera según el reporte**:
```json
{
  "email": "usuario@email.com",
  "first_name": "Juan",
  "last_name": "Perez"
}
```

---

## 🔧 Solución: Corregir Nombres de Campos

Necesitamos usar `#[serde(rename = "...")]` para mapear correctamente los campos.

### Opción 1: Usar serde rename (Recomendado)

Mantener los nombres internos pero serializar con los nombres correctos:

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

### Opción 2: Renombrar campos del struct

Cambiar los nombres de los campos en el struct:

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

Y actualizar el código que usa estos campos (líneas 460-461).

---

## 📝 Nota Importante

**Verificar documentación**: Antes de cambiar, deberíamos verificar la documentación oficial de MercadoPago para confirmar si aceptan `name/surname` o solo `first_name/last_name`.

Sin embargo, dado que el reporte específicamente menciona `payer.first_name` y `payer.last_name`, es probable que esos sean los nombres correctos.

---

## 🎯 Plan de Acción

### Paso 1: Corregir Nombres de Campos

1. Actualizar `MercadoPagoPayer` struct para usar `first_name` y `last_name`
2. O usar `#[serde(rename)]` para mapear correctamente
3. Actualizar código que usa estos campos

### Paso 2: Deploy

1. Commit y push
2. Railway deployará automáticamente
3. Procesar un nuevo pago real
4. Esperar re-evaluación de MercadoPago (hasta 24h)

---

**Estado**: Pendiente corrección de nombres de campos
