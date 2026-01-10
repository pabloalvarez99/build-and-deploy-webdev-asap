# 🔧 Ejecutar Migraciones - HAZLO AHORA

## Estado Actual
✅ Servicios funcionando (health checks OK)
❌ Base de datos vacía (por eso los APIs fallan)

## Solución: 3 Pasos Simples

### Paso 1: Abrir PostgreSQL Query Console

1. Ve a Railway Dashboard: https://railway.app/project/f9fb341e-dfa9-4e46-aefa-b4fd9115c86d
2. Haz click en **Postgres** (el servicio de base de datos)
3. Haz click en la pestaña **Data**
4. Verás un botón **Query** - haz click ahí

### Paso 2: Ejecutar Migración 001 (Tablas Principales)

1. Abre el archivo: `database/migrations/001_initial.sql`
2. Copia **TODO** el contenido (Ctrl+A, Ctrl+C)
3. Pégalo en el editor de Railway Query
4. Haz click en **Execute** o **Run**
5. Deberías ver: "Query executed successfully"

### Paso 3: Ejecutar Migración 002 (Guest Checkout)

1. Abre el archivo: `database/migrations/002_guest_checkout.sql`
2. Copia **TODO** el contenido
3. Pégalo en el editor de Railway Query
4. Haz click en **Execute** o **Run**
5. Deberías ver: "Query executed successfully"

---

## ✅ Verificación

Después de ejecutar las migraciones, te voy a verificar que todo funcione.

Avísame cuando hayas terminado de ejecutar las dos migraciones.

---

## 📋 Qué Crean Estas Migraciones

### Migración 001:
- ✅ Tabla `users` (con 1 admin)
- ✅ Tabla `categories` (5 categorías)
- ✅ Tabla `products` (8 productos de ejemplo)
- ✅ Tabla `orders`
- ✅ Tabla `order_items`
- ✅ Índices y triggers

### Migración 002:
- ✅ Columnas para guest checkout (email y session_id)
- ✅ Índices para búsquedas rápidas

---

## ⚠️ Si Hay Error

Si ves algún error al ejecutar, toma una captura y muéstramela.

Los errores comunes y soluciones:
- "Extension not found" → Normal, ignora y continúa
- "Table already exists" → Ya se ejecutó antes, puedes continuar
- "Syntax error" → Asegúrate de copiar TODO el archivo completo
