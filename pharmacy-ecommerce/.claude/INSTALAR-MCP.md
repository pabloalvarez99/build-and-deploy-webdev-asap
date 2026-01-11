# Instrucciones para Instalar MCP Servers en Cursor

**Fecha**: 2026-01-11

---

## ✅ Paquetes Ya Instalados

Los siguientes paquetes ya están instalados globalmente:

```
✅ @modelcontextprotocol/server-github
✅ @modelcontextprotocol/server-postgres
✅ @modelcontextprotocol/server-filesystem
✅ @modelcontextprotocol/server-brave-search
✅ mercadolibre-mcp (v0.1.1)
```

---

## Paso 1: Abrir Configuración de Cursor

1. Abre Cursor
2. Ve a: **File → Preferences → Cursor Settings** (o `Ctrl+Shift+J`)
3. Busca **"MCP"** o **"Tools and Integrations"**
4. Haz click en **"New MCP Server"** o **"Add MCP Server"**

---

## Paso 2: Copiar Configuración

Copia el contenido del archivo `.claude/MCP-CONFIG-CURSOR.json` al archivo `mcp.json` que se abre en Cursor.

### Contenido a copiar:

```json
{
  "mcpServers": {
    "mercadopago": {
      "url": "https://mcp.mercadopago.cl/mcp"
    },
    "mercadolibre-mcp": {
      "command": "npx",
      "args": ["-y", "mercadolibre-mcp"],
      "env": {
        "CLIENT_ID": "TU_CLIENT_ID_AQUI",
        "CLIENT_SECRET": "TU_CLIENT_SECRET_AQUI",
        "SITE_ID": "MLC"
      }
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
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "TU_BRAVE_API_KEY_AQUI"
      }
    }
  }
}
```

---

## Paso 3: Obtener Credenciales Faltantes

### 🔴 MercadoLibre (Opcional - si quieres integrar marketplace)

1. Ir a: https://developers.mercadolibre.cl/
2. Crear una aplicación
3. Obtener `CLIENT_ID` y `CLIENT_SECRET`
4. Reemplazar en la configuración

### 🔴 GitHub Token (Recomendado)

1. Ir a: https://github.com/settings/tokens
2. Click en "Generate new token (classic)"
3. Seleccionar permisos:
   - ✅ `repo` (acceso completo a repositorios)
   - ✅ `read:org`
   - ✅ `read:user`
4. Copiar el token
5. Reemplazar `TU_GITHUB_TOKEN_AQUI` en la configuración

### 🔴 Brave Search API Key (Opcional)

1. Ir a: https://brave.com/search/api/
2. Crear cuenta y obtener API key
3. Reemplazar `TU_BRAVE_API_KEY_AQUI` en la configuración

---

## Paso 4: Servidores que Funcionan Sin Credenciales

Estos servidores funcionan inmediatamente:

| Servidor | Estado | Descripción |
|----------|--------|-------------|
| **mercadopago** | ✅ Listo | Solo URL, funciona directo |
| **postgres** | ✅ Listo | Ya tiene la conexión de Railway |
| **filesystem** | ✅ Listo | Ya tiene la ruta del proyecto |

---

## Paso 5: Reiniciar Cursor

Después de guardar la configuración:
1. Cierra Cursor completamente
2. Vuelve a abrir Cursor
3. Los servidores MCP deberían aparecer en el chat

---

## Verificar Instalación

En el chat de Cursor, puedes probar:

1. **MercadoPago**: "Consulta la documentación de calidad de integración de MercadoPago"
2. **PostgreSQL**: "Muéstrame las tablas de la base de datos"
3. **FileSystem**: "Lista los archivos en el directorio apps"

---

## Troubleshooting

### "Server not connected"
- Reinicia Cursor
- Verifica que los paquetes estén instalados: `npm list -g`

### "Authentication failed"
- Verifica que las credenciales sean correctas
- Para GitHub, regenera el token

### "Command not found"
- Ejecuta: `npm install -g @modelcontextprotocol/server-github`

---

## Resumen de Credenciales del Proyecto

Ya tienes estas credenciales configuradas:

| Servicio | Credencial |
|----------|------------|
| **MercadoPago** | Application ID: `4790563553663084` |
| **PostgreSQL** | Railway: `maglev.proxy.rlwy.net:24761` |
| **GitHub Repo** | `pabloalvarez99/build-and-deploy-webdev-asap` |

---

**Última actualización**: 2026-01-11
