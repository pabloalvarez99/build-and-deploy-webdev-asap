# ✅ Configuración Completa de Servidores MCP

## 📦 Estado de Configuración

### ✅ Servidores Listos (Sin configuración adicional)

1. **MercadoPago** ✓
   - URL: `https://mcp.mercadopago.cl/mcp`
   - Estado: Configurado y listo

2. **PostgreSQL** ✓
   - Connection String: Configurado
   - Estado: Listo para usar

3. **Filesystem** ✓
   - Ruta: `C:\Users\Pablo\Documents\GitHub\build-and-deploy-webdev-asap\pharmacy-ecommerce`
   - Estado: Configurado y listo

4. **Vercel** ✓
   - URL: `https://mcp.vercel.com`
   - Estado: Configurado (requiere OAuth al primer uso)

### ⚙️ Servidores que Requieren Credenciales

1. **MercadoLibre MCP** ⚠️
   - Necesita: `CLIENT_ID` y `CLIENT_SECRET`
   - Guía: Ver `.claude/MCP-SETUP-GUIDE.md`

2. **GitHub MCP** ⚠️
   - Necesita: `GITHUB_PERSONAL_ACCESS_TOKEN`
   - Guía: Ver `.claude/MCP-SETUP-GUIDE.md`

3. **Brave Search MCP** ⚠️
   - Necesita: `BRAVE_API_KEY`
   - Guía: Ver `.claude/MCP-SETUP-GUIDE.md`

## 🚀 Cómo Configurar

### Opción 1: Script Interactivo (Recomendado)

```powershell
cd pharmacy-ecommerce
.\configure-mcp.ps1
```

El script te guiará paso a paso para configurar todos los servidores.

### Opción 2: Configuración Manual

1. Edita el archivo: `C:\Users\Pablo\AppData\Roaming\Cursor\User\mcp.json`
2. Reemplaza los valores `TU_XXX_AQUI` con tus credenciales reales
3. Guarda el archivo
4. Reinicia Cursor

## 📁 Archivos Creados

- ✅ `configure-mcp.ps1` - Script de configuración interactivo
- ✅ `.claude/MCP-SETUP-GUIDE.md` - Guía detallada con instrucciones
- ✅ `.claude/MCP-CONFIG-CURSOR.json` - Configuración de referencia
- ✅ `.claude/MCP-CONFIG-SIMPLIFICADO.json` - Configuración simplificada

## 🔄 Próximos Pasos

1. **Ejecuta el script de configuración:**
   ```powershell
   .\configure-mcp.ps1
   ```

2. **Obtén las credenciales faltantes:**
   - MercadoLibre: https://developers.mercadolibre.com.ar/en_us/usuarios-y-aplicaciones
   - GitHub: https://github.com/settings/tokens
   - Brave Search: https://api-dashboard.search.brave.com/app/keys

3. **Reinicia Cursor completamente**

4. **Autentica Vercel** (se pedirá automáticamente la primera vez)

## 📚 Documentación

Para más detalles, consulta: `.claude/MCP-SETUP-GUIDE.md`
