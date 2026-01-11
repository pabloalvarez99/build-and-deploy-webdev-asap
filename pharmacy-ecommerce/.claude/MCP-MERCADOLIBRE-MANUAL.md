# Configurar MercadoLibre MCP Manualmente

**Problema**: El redirect OAuth no funciona con Cursor

**Solución**: Configurar con credenciales directas

---

## Paso 1: Obtener Credenciales de MercadoLibre

1. Ve a: https://developers.mercadolibre.cl/apps
2. Si no tienes una aplicación, crea una:
   - Click en **"Crear aplicación"**
   - Nombre: "Tu Farmacia - MCP"
   - Redirect URI: `http://localhost:3000/callback` (no importa mucho)
   - Permisos: read

3. Una vez creada, verás:
   - **CLIENT_ID** (App ID)
   - **CLIENT_SECRET** (Secret Key)

---

## Paso 2: Configurar en Cursor

### Opción A: Configuración Simple (Sin OAuth)

En la configuración de Cursor MCP, usa:

```json
{
  "mcpServers": {
    "mercadolibre-mcp": {
      "command": "npx",
      "args": ["-y", "mercadolibre-mcp"],
      "env": {
        "CLIENT_ID": "TU_CLIENT_ID_AQUI",
        "CLIENT_SECRET": "TU_CLIENT_SECRET_AQUI",
        "SITE_ID": "MLC"
      }
    }
  }
}
```

### Opción B: Deshabilitar MercadoLibre (si no lo necesitas ahora)

Si no vas a usar el marketplace de MercadoLibre, simplemente **elimina** esa sección de la configuración MCP:

```json
{
  "mcpServers": {
    "mercadopago": {
      "url": "https://mcp.mercadopago.cl/mcp"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "TU_GITHUB_TOKEN_AQUI"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\pablo\\Documents\\build-and-deploy-webdev-asap\\pharmacy-ecommerce"
      ]
    }
  }
}
```

---

## ¿Realmente necesitas MercadoLibre MCP?

**NO lo necesitas** si:
- ❌ Solo vendes en tu propio sitio web
- ❌ No estás integrando con el marketplace de MercadoLibre
- ❌ Solo usas MercadoPago para pagos

**SÍ lo necesitas** si:
- ✅ Quieres vender también en MercadoLibre
- ✅ Necesitas buscar productos de otros vendedores
- ✅ Quieres importar catálogos de MercadoLibre

---

## Recomendación para tu proyecto

Para Tu Farmacia E-commerce, **NO necesitas MercadoLibre MCP** en este momento.

Solo necesitas:
- ✅ **MercadoPago MCP** (para pagos) - Ya configurado
- ✅ **GitHub MCP** (para gestión de código)
- ✅ **PostgreSQL MCP** (para base de datos)
- ✅ **FileSystem MCP** (para archivos)

---

**Próximo paso**: Eliminar MercadoLibre de la configuración y probar con los otros servidores.
