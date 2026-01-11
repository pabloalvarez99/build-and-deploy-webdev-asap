# MCP Servers Útiles para Tu Farmacia E-commerce

**Fecha**: 2026-01-11  
**Propósito**: Guía para instalar y configurar MCP (Model Context Protocol) servers útiles para el proyecto

---

## ¿Qué es MCP?

MCP (Model Context Protocol) permite que los modelos de IA accedan a herramientas y datos externos de manera estructurada. En Cursor, los MCP servers te permiten interactuar con APIs y servicios directamente desde el chat.

---

## MCP Servers Recomendados

### 1. MercadoPago MCP Server ⭐ PRIORITARIO

**Para qué sirve**:
- Documentación de MercadoPago directamente en Cursor
- Sugerencias de código para integraciones
- Evaluación de calidad de integración
- Acceso a la API de MercadoPago

**Instalación**:
1. Abrir configuración de Cursor: `Ctrl+,` (Windows) o `Cmd+,` (Mac)
2. Buscar "MCP" o "Model Context Protocol"
3. Agregar servidor:
   ```json
   {
     "mcpServers": {
       "mercadopago": {
         "url": "https://mcp.mercadopago.cl/mcp"
       }
     }
   }
   ```
4. Autenticarse con credenciales de MercadoPago

**Credenciales necesarias** (ya las tienes):
- Application ID: `4790563553663084`
- User ID: `170193821`
- Access Token: `APP_USR-4790563553663084-010811-588bd914effd0972900f06380fc851d2-170193821`

**Enlace**: https://mcp.mercadopago.cl/

---

### 2. MercadoLibre MCP Server

**Para qué sirve**:
- Búsqueda de productos en MercadoLibre
- Obtener descripciones de productos
- Ver reseñas y reputación de vendedores
- Integración con marketplace

**Instalación**:
```bash
npx -y @smithery/cli install @lumile/mercadolibre-mcp --client claude
```

**Configuración** (requiere credenciales de MercadoLibre):
```json
{
  "mcpServers": {
    "mercadolibre-mcp": {
      "command": "npx",
      "args": ["-y", "mercadolibre-mcp"],
      "env": {
        "CLIENT_ID": "<TU_CLIENT_ID>",
        "CLIENT_SECRET": "<TU_CLIENT_SECRET>",
        "SITE_ID": "MLC"  // Chile
      }
    }
  }
}
```

**Credenciales**: Necesitas crear una aplicación en https://developers.mercadolibre.com/

**Repositorio**: https://github.com/lumile/mercadolibre-mcp

---

### 3. GitHub MCP Server ⭐ MUY ÚTIL

**Para qué sirve**:
- Ver y crear issues directamente desde Cursor
- Crear pull requests
- Revisar código y commits
- Gestión de repositorios

**Instalación**:
```bash
npx -y @smithery/cli install @modelcontextprotocol/server-github
```

**Configuración**:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "<TU_TOKEN>"
      }
    }
  }
}
```

**Token GitHub**: Crear en https://github.com/settings/tokens  
**Permisos necesarios**: `repo`, `read:org`, `read:user`

**Repositorio**: https://github.com/modelcontextprotocol/servers/tree/main/src/github

---

### 4. PostgreSQL MCP Server ⭐ ÚTIL

**Para qué sirve**:
- Consultar base de datos directamente desde Cursor
- Ejecutar queries SQL
- Ver estructura de tablas
- Debugging de datos

**Instalación**:
```bash
npm install -g @modelcontextprotocol/server-postgres
```

**Configuración**:
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres:RLfkDsoXZmYIjkeoavlWkNXaCGFovWXT@maglev.proxy.rlwy.net:24761/railway"
      }
    }
  }
}
```

**⚠️ PRECAUCIÓN**: Usar solo para desarrollo. No exponer credenciales de producción en configuración local.

**Repositorio**: https://github.com/modelcontextprotocol/servers/tree/main/src/postgres

---

### 5. File System MCP Server

**Para qué sirve**:
- Leer y escribir archivos del proyecto
- Navegar estructura de directorios
- Buscar archivos
- Gestión de código

**Instalación**:
```bash
npx -y @smithery/cli install @modelcontextprotocol/server-filesystem
```

**Configuración**:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/ruta/al/proyecto"],
      "env": {}
    }
  }
}
```

**Repositorio**: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem

---

### 6. Brave Search MCP Server

**Para qué sirve**:
- Búsquedas web desde Cursor
- Información actualizada
- Investigación rápida

**Instalación**:
```bash
npx -y @smithery/cli install @modelcontextprotocol/server-brave-search
```

**Configuración**:
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "<TU_API_KEY>"
      }
    }
  }
}
```

**API Key**: Obtener en https://brave.com/search/api/

---

## Configuración en Cursor

### Ubicación del archivo de configuración

La configuración de MCP en Cursor puede estar en:

1. **Configuración de Cursor (recomendado)**:
   - `Ctrl+,` (Windows) o `Cmd+,` (Mac)
   - Buscar "MCP" en settings
   - Agregar servidores desde la UI

2. **Archivo de configuración manual** (si existe):
   - Windows: `%APPDATA%\Cursor\User\settings.json`
   - Mac: `~/Library/Application Support/Cursor/User/settings.json`
   - Linux: `~/.config/Cursor/User/settings.json`

### Formato de configuración

```json
{
  "mcp.servers": {
    "mercadopago": {
      "url": "https://mcp.mercadopago.cl/mcp"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
      }
    }
  }
}
```

---

## Priorización de Instalación

### Alta Prioridad (Instalar primero)
1. **MercadoPago MCP** - Para resolver el problema actual de integración
2. **GitHub MCP** - Para gestión del repositorio
3. **File System MCP** - Para gestión de código

### Media Prioridad
4. **PostgreSQL MCP** - Para debugging de base de datos (solo desarrollo)
5. **MercadoLibre MCP** - Si planeas integración con marketplace

### Baja Prioridad
6. **Brave Search MCP** - Para búsquedas web (ya tienes web_search en Cursor)

---

## Instrucciones Paso a Paso

### Instalación de MercadoPago MCP (Ejemplo)

1. **Abrir Cursor Settings**:
   ```
   Ctrl+, (Windows) o Cmd+, (Mac)
   ```

2. **Buscar "MCP"** en la barra de búsqueda de settings

3. **Agregar nuevo servidor**:
   - Click en "Add MCP Server" o "Configure MCP"
   - Nombre: `mercadopago`
   - Tipo: URL o Command
   - URL: `https://mcp.mercadopago.cl/mcp`
   - O si es command:
     ```json
     {
       "command": "npx",
       "args": ["-y", "@mercadopago/mcp-server"]
     }
     ```

4. **Autenticarse** (si se requiere):
   - Usar Application ID y Access Token de producción
   - Application ID: `4790563553663084`
   - Access Token: `APP_USR-4790563553663084-010811-588bd914effd0972900f06380fc851d2-170193821`

5. **Reiniciar Cursor** para cargar el servidor

6. **Verificar**:
   - En el chat, deberías poder usar herramientas de MercadoPago
   - Ejemplo: "Consulta la documentación de MercadoPago sobre calidad de integración"

---

## Troubleshooting

### El servidor no se conecta
- Verificar que las credenciales sean correctas
- Verificar conexión a internet
- Revisar logs de Cursor (Help → Toggle Developer Tools → Console)

### Error de autenticación
- Verificar que los tokens/keys sean válidos
- Regenerar tokens si es necesario
- Verificar permisos de los tokens

### Servidor no aparece en el chat
- Reiniciar Cursor completamente
- Verificar que el servidor esté habilitado en settings
- Revisar formato JSON de configuración

---

## Recursos Útiles

### Documentación
- **MCP Protocol**: https://modelcontextprotocol.io/
- **MCP Servers**: https://github.com/modelcontextprotocol/servers
- **MercadoPago MCP**: https://mcp.mercadopago.cl/
- **Smithery (Instalador)**: https://smithery.ai/

### Repositorios de Referencia
- **MCP Servers oficiales**: https://github.com/modelcontextprotocol/servers
- **MercadoLibre MCP**: https://github.com/lumile/mercadolibre-mcp
- **Community servers**: Buscar en GitHub con tag `mcp-server`

---

## Notas Importantes

1. **Seguridad**: 
   - ⚠️ NO commits credenciales en el repositorio
   - ⚠️ Usar variables de entorno cuando sea posible
   - ⚠️ No compartir tokens de acceso

2. **Credenciales de Producción**:
   - PostgreSQL MCP solo en desarrollo local
   - Para producción, usar Railway Dashboard o CLI

3. **Performance**:
   - Cada MCP server consume recursos
   - Solo instalar los que realmente necesites
   - Deshabilitar servidores no usados

4. **Actualizaciones**:
   - Los servidores instalados con `npx -y` se actualizan automáticamente
   - Servidores URL pueden cambiar sin aviso
   - Revisar documentación periódicamente

---

**Última actualización**: 2026-01-11  
**Próxima revisión**: Después de instalar MercadoPago MCP para resolver problema actual