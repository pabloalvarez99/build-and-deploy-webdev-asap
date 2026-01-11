# Pasos para Activar MCP en Cursor - Instrucciones Paso a Paso

## Método 1: Usando la UI de Cursor (MÁS FÁCIL)

### Paso 1: Abrir Configuración de MCP

1. En Cursor, presiona: **`Ctrl + Shift + J`** (o `Cmd + Shift + J` en Mac)
   - O ve a: **Cursor → Settings → Features → Enable MCP**

2. Busca la opción que dice **"Model Context Protocol"** o **"MCP Servers"**

3. Deberías ver un botón como **"Edit Config"** o **"Configure MCP"**

### Paso 2: Copiar Configuración

Cuando se abra el editor, **copia TODO esto**:

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
        "GITHUB_PERSONAL_ACCESS_TOKEN": ""
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

### Paso 3: Guardar y Reiniciar

1. **Guarda** el archivo de configuración
2. **Cierra Cursor completamente** (no solo la ventana)
3. **Vuelve a abrir Cursor**

### Paso 4: Verificar

En el chat de Cursor, deberías poder usar las herramientas MCP.

---

## Método 2: Editar Archivo Manualmente

Si no encuentras la opción de MCP en la UI:

### Windows:
1. Abre: `%APPDATA%\Cursor\User\globalStorage\`
2. Busca un archivo como `mcp-settings.json` o similar
3. O crea uno nuevo

### Mac:
1. Abre: `~/Library/Application Support/Cursor/User/globalStorage/`
2. Busca `mcp-settings.json`

### Linux:
1. Abre: `~/.config/Cursor/User/globalStorage/`
2. Busca `mcp-settings.json`

---

## Troubleshooting

### "No veo la opción de MCP en Cursor"

Puede que necesites:
1. Actualizar Cursor a la última versión
2. Habilitar features experimentales:
   - `Ctrl + Shift + P` → "Preferences: Open User Settings (JSON)"
   - Agregar: `"cursor.experimental.mcp.enabled": true`

### "Los servidores no se conectan"

Verifica que los paquetes estén instalados:
```bash
npm list -g | findstr modelcontextprotocol
```

Si no aparecen, reinstala:
```bash
npm install -g @modelcontextprotocol/server-github @modelcontextprotocol/server-postgres @modelcontextprotocol/server-filesystem
```

### "GitHub token requerido"

Para usar GitHub MCP:
1. Ve a: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Selecciona permisos: `repo`, `read:org`, `read:user`
4. Copia el token
5. Pégalo en `GITHUB_PERSONAL_ACCESS_TOKEN` en la configuración

---

## ¿Qué harán estos servidores?

### MercadoPago MCP ✅
- Consultar documentación de MercadoPago
- Ver requisitos de integración
- Obtener ejemplos de código
- **NO necesita token**, funciona inmediatamente

### PostgreSQL MCP ✅
- Consultar tablas de la base de datos
- Ver estructura de datos
- Ejecutar queries
- **Ya configurado con Railway**, funciona inmediatamente

### FileSystem MCP ✅
- Leer archivos del proyecto
- Navegar directorios
- Gestionar código
- **Ya configurado**, funciona inmediatamente

### GitHub MCP ⚠️
- Crear issues
- Ver commits
- Gestionar repositorio
- **Necesita token de GitHub**

---

## Servidores que funcionan SIN tokens:

1. ✅ **MercadoPago** (solo URL)
2. ✅ **PostgreSQL** (ya tiene conexión de Railway)
3. ✅ **FileSystem** (ya tiene ruta del proyecto)

## Servidores que necesitan token:

4. ⚠️ **GitHub** (necesita token, pero es opcional)

---

**Recomendación**: Empieza sin el token de GitHub para probar los otros 3 servidores primero.
