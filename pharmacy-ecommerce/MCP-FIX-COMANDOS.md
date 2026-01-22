# Comandos para arreglar los MCP servers

## Qué se hizo

1. **postgres** ✅  
   - **Problema:** El MCP usa la connection string como **argumento** (`args`), no como variable de entorno.  
   - **Solución:** Se pasó la URL de PostgreSQL en `args` y se quitó `env.POSTGRES_CONNECTION_STRING`.  
   - **Comando aplicado:** Editar `%APPDATA%\Cursor\User\mcp.json` y usar esta config:
   ```json
   "postgres": {
     "command": "npx",
     "args": [
       "-y",
       "@modelcontextprotocol/server-postgres",
       "postgresql://postgres:TU_PASSWORD@maglev.proxy.rlwy.net:24761/railway"
     ]
   }
   ```
   (La connection string ya está correcta en tu `mcp.json`.)

2. **brave-search** ⚠️  
   - **Problema:** Falta una API key válida (`BRAVE_API_KEY`).  
   - **Solución:** Se desactivó en `mcp.json` para quitar el error. Para usarlo de nuevo:

   **Pasos:**
   - Obtener API key: https://api-dashboard.search.brave.com/app/keys (tier gratuito: 2000 búsquedas/mes).
   - Abrir `%APPDATA%\Cursor\User\mcp.json`.
   - Dentro de `mcpServers`, añadir:
   ```json
   "brave-search": {
     "command": "npx",
     "args": ["-y", "@modelcontextprotocol/server-brave-search"],
     "env": {
       "BRAVE_API_KEY": "TU_API_KEY_REAL"
     }
   }
   ```
   - Guardar y **reiniciar Cursor**.

3. **mercadopago** ⚠️  
   - **Problema:** La URL correcta es `https://mcp.mercadopago.com/mcp` (`.com`, no `.cl`) y hace falta **Authorization: Bearer ACCESS_TOKEN**.  
   - **Solución:** Se desactivó en `mcp.json`. Para reactivarlo:

   **Pasos:**
   - Obtener Access Token de MercadoPago:  
     https://www.mercadopago.cl/developers/panel/app  
     → Tu app → Credenciales de producción o de prueba → Access Token.
   - Probar credenciales (opcional):
     ```powershell
     Invoke-WebRequest -Uri "https://api.mercadopago.com/v1/payment_methods" -Headers @{ "Authorization" = "Bearer TU_ACCESS_TOKEN" } -UseBasicParsing
     ```
   - Abrir `%APPDATA%\Cursor\User\mcp.json`.
   - Dentro de `mcpServers`, añadir (reemplaza `TU_ACCESS_TOKEN`):
   ```json
   "mercadopago": {
     "url": "https://mcp.mercadopago.com/mcp",
     "headers": {
       "Authorization": "Bearer TU_ACCESS_TOKEN"
     }
   }
   ```
   - Guardar y **reiniciar Cursor**.

   Si Cursor no usa `headers` para MCP por URL, probar por terminal:
   ```powershell
   npx -y mcp-remote@latest https://mcp.mercadopago.com/mcp --header "Authorization:Bearer TU_ACCESS_TOKEN"
   ```
   Y revisar: https://www.mercadopago.cl/developers/es/docs/mcp-server/mcp-server-troubleshooting

---

## Resumen

| MCP          | Estado   | Acción                                              |
|--------------|----------|-----------------------------------------------------|
| **postgres** | Arreglado| Ya corregido en `mcp.json`; reiniciar Cursor.       |
| **brave-search** | Desactivado | Reactivar solo si tienes API key (pasos arriba). |
| **mercadopago**  | Desactivado | Reactivar solo si tienes Access Token (pasos arriba). |

## Después de cambiar `mcp.json`

1. Cerrar Cursor por completo.  
2. Volver a abrirlo.  
3. Revisar en la lista de MCP que postgres (y los que reactives) aparezcan sin error.
