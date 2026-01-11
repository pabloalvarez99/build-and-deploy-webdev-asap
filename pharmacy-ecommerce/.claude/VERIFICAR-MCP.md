# Verificar Instalación de MCP en Cursor

**Estado**: Configuración aplicada, pero los servidores no aparecen como disponibles

---

## Posibles Razones

### 1. Cursor necesita configuración adicional

En Cursor, los MCP servers pueden requerir:
- Habilitación explícita en settings
- Formato de configuración específico de Cursor (no estándar MCP)
- Ubicación específica del archivo de configuración

### 2. Ubicación del archivo de configuración

El archivo `mcp.json` puede necesitar estar en:
- `%APPDATA%\Cursor\User\settings.json` (Windows)
- Dentro de la configuración JSON de Cursor como propiedad `cursor.mcp.servers`
- Un archivo separado en `%APPDATA%\Cursor\mcp.json`

### 3. Formato de configuración

Cursor puede requerir un formato diferente. Intenta esto en `settings.json`:

```json
{
  "cursor.mcp.enabled": true,
  "cursor.mcp.servers": {
    "mercadopago": {
      "url": "https://mcp.mercadopago.cl/mcp"
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

## Verificar en Cursor

### 1. Verificar en el Chat

Intenta estas preguntas en el chat de Cursor:

- "¿Qué herramientas MCP tienes disponibles?"
- "Lista los servidores MCP conectados"
- "Usa MercadoPago MCP para consultar documentación"

### 2. Verificar en Developer Tools

1. Presiona: `Ctrl + Shift + I` (o `Cmd + Option + I` en Mac)
2. Ve a la pestaña **Console**
3. Busca mensajes sobre MCP o errores

### 3. Verificar en Settings

1. `Ctrl + ,` → Buscar "MCP"
2. Ver si hay opciones como:
   - "Enable MCP"
   - "MCP Servers"
   - "Model Context Protocol"

---

## Alternativa: Verificar si MCP funciona sin configuración

Es posible que Cursor no soporte MCP servers externos de la misma manera que Claude Desktop.

**Opciones**:
1. **Verificar documentación de Cursor**: Buscar si Cursor soporta MCP servers
2. **Contactar soporte de Cursor**: Puede que sea una feature experimental
3. **Usar herramientas nativas**: Cursor ya tiene muchas herramientas integradas (GitHub, file system, etc.)

---

## Estado Actual

✅ **Paquetes instalados**: Los paquetes npm están instalados correctamente
✅ **Configuración creada**: El archivo JSON tiene el formato correcto
❓ **Conexión en Cursor**: No está claro si Cursor reconoce los MCP servers

---

## Próximos Pasos Sugeridos

1. **Verificar en el chat de Cursor** si puedes usar herramientas MCP
2. **Revisar logs de Cursor** (Developer Tools → Console)
3. **Verificar documentación de Cursor** sobre soporte MCP
4. **Considerar que puede ser una limitación de Cursor**: Puede que Cursor no soporte MCP servers externos como Claude Desktop

---

**Nota**: Es posible que Cursor tenga un sistema diferente de extensibilidad y no use MCP servers de la misma manera que otras aplicaciones.
