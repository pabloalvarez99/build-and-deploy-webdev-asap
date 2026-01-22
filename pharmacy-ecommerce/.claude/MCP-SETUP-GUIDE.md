# 📚 Guía de Configuración de Servidores MCP

Esta guía te ayudará a configurar todos los servidores MCP (Model Context Protocol) para **Cursor** y **Claude Code**.

## 🚀 Inicio Rápido

### Cursor

```powershell
cd pharmacy-ecommerce
.\configure-mcp.ps1
```

### Claude Code

1. **Instalar Claude Code** (si no lo tienes):

   ```powershell
   # PowerShell (recomendado)
   irm https://claude.ai/install.ps1 | iex

   # O con WinGet
   winget install Anthropic.ClaudeCode
   ```

2. **Usar MCP en este proyecto:**

   El archivo `.mcp.json` en la raíz de `pharmacy-ecommerce` ya define los servidores. Entra al proyecto y ejecuta Claude Code:

   ```powershell
   cd pharmacy-ecommerce
   claude
   ```

3. **GitHub (opcional):** Si usas el servidor GitHub, define el token antes de abrir Claude:

   ```powershell
   $env:GITHUB_PERSONAL_ACCESS_TOKEN = "tu_token_aqui"
   claude
   ```

4. **Verificar servidores:** Dentro de Claude Code, escribe `/mcp` para ver estado y autenticación.

## 📋 Servidores MCP Configurados

### ✅ Ya Configurados (No requieren credenciales)

1. **MercadoPago** - URL: `https://mcp.mercadopago.cl/mcp`
2. **PostgreSQL** - Connection string ya configurado
3. **Filesystem** - Ruta del proyecto configurada
4. **Vercel** - URL: `https://mcp.vercel.com` (requiere OAuth al primer uso)

### ⚙️ Requieren Configuración

#### 1. MercadoLibre MCP

**Credenciales necesarias:**
- `CLIENT_ID`
- `CLIENT_SECRET`
- `SITE_ID` (ya configurado como "MLC")

**Cómo obtener las credenciales:**

1. Ve a: https://developers.mercadolibre.com.ar/en_us/usuarios-y-aplicaciones
2. Inicia sesión con tu cuenta de MercadoLibre
3. Haz clic en "Crear nueva aplicación"
4. Completa los campos obligatorios:
   - Nombre de la aplicación (debe ser único)
   - Descripción (máx. 150 caracteres)
   - Logo
   - Redirect URIs (debe usar HTTPS)
5. Copia el **Client ID** y **Secret Key**

**Nota:** En Argentina, México, Brasil y Chile, primero debes verificar los datos del titular de la cuenta.

---

#### 2. GitHub MCP

**Credencial necesaria:**
- `GITHUB_PERSONAL_ACCESS_TOKEN`

**Cómo obtener el token:**

1. Ve a: https://github.com/settings/tokens
2. Haz clic en "Generate new token (classic)"
3. Dale un nombre descriptivo (ej: "Cursor MCP")
4. Selecciona los siguientes scopes:
   - `repo` (acceso completo a repositorios)
   - `read:org` (leer información de organizaciones)
   - `read:user` (leer información de usuario)
5. Haz clic en "Generate token"
6. **¡IMPORTANTE!** Copia el token inmediatamente, no podrás verlo de nuevo

---

#### 3. Brave Search MCP

**Credencial necesaria:**
- `BRAVE_API_KEY`

**Cómo obtener la API key:**

1. Ve a: https://api-dashboard.search.brave.com/app/subscriptions/subscribe
2. Elige un plan (hay un tier gratuito disponible)
3. Una vez suscrito, ve a: https://api-dashboard.search.brave.com/app/keys
4. Haz clic en "Create new key"
5. Copia el token generado

---

## 🔧 Configuración Manual

Si prefieres configurar manualmente, edita el archivo:

**Windows:**
```
C:\Users\Pablo\AppData\Roaming\Cursor\User\mcp.json
```

**Ejemplo de configuración completa:**

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
        "C:\\Users\\Pablo\\Documents\\GitHub\\build-and-deploy-webdev-asap\\pharmacy-ecommerce"
      ]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "TU_BRAVE_API_KEY_AQUI"
      }
    },
    "vercel": {
      "url": "https://mcp.vercel.com"
    }
  }
}
```

## 🔄 Después de Configurar

1. **Reinicia Cursor completamente:**
   - Cierra todas las ventanas de Cursor
   - Vuelve a abrir Cursor

2. **Autenticación OAuth (solo para Vercel):**
   - La primera vez que uses Vercel MCP, Cursor te pedirá autenticarte
   - Sigue el flujo de OAuth que aparecerá automáticamente

3. **Verificación:**
   - Los servidores MCP se cargarán automáticamente al iniciar Cursor
   - Puedes usar comandos relacionados con cada servicio en el chat

## 🛠️ Solución de Problemas

### El servidor MCP no se conecta

1. Verifica que las credenciales sean correctas
2. Asegúrate de haber reiniciado Cursor
3. Revisa la consola de Cursor para ver errores

### Error de autenticación

- **GitHub:** Verifica que el token tenga los scopes correctos
- **MercadoLibre:** Asegúrate de que la aplicación esté activa
- **Brave:** Verifica que la API key sea válida y no haya expirado
- **Vercel:** Completa el flujo de OAuth cuando se solicite

### El servidor no aparece en Cursor

1. Verifica que el archivo `mcp.json` esté en la ubicación correcta
2. Verifica la sintaxis JSON (usa un validador JSON online)
3. Reinicia Cursor completamente

## 📝 Notas Importantes

- **Nunca compartas tus credenciales** - Mantén el archivo `mcp.json` privado
- **Actualiza tokens expirados** - Algunos tokens pueden tener fecha de expiración
- **Backup de configuración** - Guarda una copia de tu configuración en un lugar seguro

## 📱 Claude Code – Resumen

| Servidor    | Tipo  | Estado típico        | Notas                                      |
|------------|-------|----------------------|--------------------------------------------|
| mercadopago| HTTP  | Puede fallar         | Red / URL remota                           |
| postgres   | stdio | Puede fallar         | Revisar `POSTGRES_CONNECTION_STRING`       |
| filesystem | stdio | ✓ Connected          | Ruta del proyecto en `.mcp.json`           |
| github     | stdio | ✓ Connected          | Opcional: `GITHUB_PERSONAL_ACCESS_TOKEN`   |
| vercel     | HTTP  | ⚠ Needs auth         | Usa `/mcp` en Claude Code para OAuth       |

Archivo de configuración: `pharmacy-ecommerce/.mcp.json`.  
Script de verificación: `.\setup-mcp-claude-code.ps1`.

## 🔗 Enlaces Útiles

- [Documentación de MCP](https://modelcontextprotocol.io/)
- [Claude Code – MCP](https://code.claude.com/docs/en/mcp)
- [GitHub Tokens](https://github.com/settings/tokens)
- [MercadoLibre Developers](https://developers.mercadolibre.com.ar/)
- [Brave Search API](https://api-dashboard.search.brave.com/)
- [Vercel MCP](https://vercel.com/docs/mcp)
