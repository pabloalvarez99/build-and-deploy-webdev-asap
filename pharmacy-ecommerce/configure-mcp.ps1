# Script de Configuración de Servidores MCP
# Este script ayuda a configurar todos los servidores MCP para Cursor

Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          CONFIGURACIÓN DE SERVIDORES MCP PARA CURSOR          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$mcpConfigPath = "$env:APPDATA\Cursor\User\mcp.json"
$configTemplate = @'
{
  "mcpServers": {
    "mercadopago": {
      "url": "https://mcp.mercadopago.cl/mcp"
    },
    "mercadolibre-mcp": {
      "command": "npx",
      "args": ["-y", "mercadolibre-mcp"],
      "env": {
        "CLIENT_ID": "",
        "CLIENT_SECRET": "",
        "SITE_ID": "MLC"
      }
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
        "C:\\Users\\Pablo\\Documents\\GitHub\\build-and-deploy-webdev-asap\\pharmacy-ecommerce"
      ]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": ""
      }
    },
    "vercel": {
      "url": "https://mcp.vercel.com"
    },
    "railway": {
      "command": "npx",
      "args": ["-y", "@railway/mcp-server"]
    }
  }
}
'@

# Función para obtener credenciales
function Get-CredentialInput {
    param(
        [string]$Prompt,
        [string]$HelpUrl,
        [switch]$Required = $false
    )
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host $Prompt -ForegroundColor Yellow
    if ($HelpUrl) {
        Write-Host "💡 Ayuda: $HelpUrl" -ForegroundColor Cyan
    }
    if ($Required) {
        Write-Host "⚠️  Este campo es OBLIGATORIO" -ForegroundColor Red
    } else {
        Write-Host "ℹ️  Presiona Enter para omitir" -ForegroundColor Gray
    }
    $value = Read-Host "Ingresa el valor"
    return $value
}

Write-Host "Este script te ayudará a configurar todos los servidores MCP." -ForegroundColor Green
Write-Host "Algunos servidores ya están configurados (MercadoPago, PostgreSQL, Filesystem, Vercel, Railway)." -ForegroundColor Green
Write-Host ""

# Verificar si ya existe configuración
$existingConfig = $null
if (Test-Path $mcpConfigPath) {
    try {
        $existingConfig = Get-Content $mcpConfigPath -Raw | ConvertFrom-Json
        Write-Host "✅ Configuración existente encontrada" -ForegroundColor Green
        Write-Host "¿Deseas actualizar solo los campos vacíos? (S/N)" -ForegroundColor Yellow
        $updateOnly = Read-Host
        if ($updateOnly -eq "S" -or $updateOnly -eq "s") {
            $config = $existingConfig
        } else {
            $config = $configTemplate | ConvertFrom-Json
        }
    } catch {
        Write-Host "⚠️  Error al leer configuración existente, creando nueva..." -ForegroundColor Yellow
        $config = $configTemplate | ConvertFrom-Json
    }
} else {
    $config = $configTemplate | ConvertFrom-Json
}

# Configurar MercadoLibre
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "1️⃣  CONFIGURAR MERCADOLIBRE MCP" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "Para obtener credenciales:" -ForegroundColor White
Write-Host "  1. Ve a: https://developers.mercadolibre.com.ar/en_us/usuarios-y-aplicaciones" -ForegroundColor Cyan
Write-Host "  2. Crea una nueva aplicación" -ForegroundColor Cyan
Write-Host "  3. Copia el Client ID y Secret Key" -ForegroundColor Cyan

$mlClientId = Get-CredentialInput -Prompt "MercadoLibre CLIENT_ID:" -HelpUrl "https://developers.mercadolibre.com.ar/en_us/usuarios-y-aplicaciones"
$mlClientSecret = Get-CredentialInput -Prompt "MercadoLibre CLIENT_SECRET:" -HelpUrl "https://developers.mercadolibre.com.ar/en_us/usuarios-y-aplicaciones"

if ($mlClientId) { $config.mcpServers."mercadolibre-mcp".env.CLIENT_ID = $mlClientId }
if ($mlClientSecret) { $config.mcpServers."mercadolibre-mcp".env.CLIENT_SECRET = $mlClientSecret }

# Configurar GitHub
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "2️⃣  CONFIGURAR GITHUB MCP" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "Para obtener un token:" -ForegroundColor White
Write-Host "  1. Ve a: https://github.com/settings/tokens" -ForegroundColor Cyan
Write-Host "  2. Click en 'Generate new token (classic)'" -ForegroundColor Cyan
Write-Host "  3. Selecciona los scopes: repo, read:org, read:user" -ForegroundColor Cyan
Write-Host "  4. Copia el token generado" -ForegroundColor Cyan

$githubToken = Get-CredentialInput -Prompt "GitHub Personal Access Token:" -HelpUrl "https://github.com/settings/tokens"

if ($githubToken) { $config.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN = $githubToken }

# Configurar Brave Search
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "3️⃣  CONFIGURAR BRAVE SEARCH MCP" -ForegroundColor Magenta
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "Para obtener una API key:" -ForegroundColor White
Write-Host "  1. Ve a: https://api-dashboard.search.brave.com/app/subscriptions/subscribe" -ForegroundColor Cyan
Write-Host "  2. Elige un plan (hay tier gratuito)" -ForegroundColor Cyan
Write-Host "  3. Ve a: https://api-dashboard.search.brave.com/app/keys" -ForegroundColor Cyan
Write-Host "  4. Crea una nueva key y copia el token" -ForegroundColor Cyan

$braveKey = Get-CredentialInput -Prompt "Brave Search API Key:" -HelpUrl "https://api-dashboard.search.brave.com/app/keys"

if ($braveKey) { $config.mcpServers."brave-search".env.BRAVE_API_KEY = $braveKey }

# Guardar configuración
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "💾 GUARDANDO CONFIGURACIÓN..." -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green

try {
    # Asegurar que el directorio existe
    $mcpDir = Split-Path $mcpConfigPath -Parent
    if (-not (Test-Path $mcpDir)) {
        New-Item -ItemType Directory -Path $mcpDir -Force | Out-Null
    }
    
    # Convertir a JSON con formato bonito
    $jsonContent = $config | ConvertTo-Json -Depth 10
    $jsonContent | Out-File -FilePath $mcpConfigPath -Encoding UTF8
    
    Write-Host "✅ Configuración guardada en: $mcpConfigPath" -ForegroundColor Green
    
    # También actualizar el archivo de referencia
    $refConfigPath = "C:\Users\Pablo\Documents\GitHub\build-and-deploy-webdev-asap\pharmacy-ecommerce\.claude\MCP-CONFIG-CURSOR.json"
    if (Test-Path (Split-Path $refConfigPath -Parent)) {
        $jsonContent | Out-File -FilePath $refConfigPath -Encoding UTF8
        Write-Host "✅ Archivo de referencia actualizado" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host "✅ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Servidores MCP configurados:" -ForegroundColor Cyan
    Write-Host "   ✓ MercadoPago (URL)" -ForegroundColor Green
    Write-Host "   ✓ MercadoLibre $(if ($mlClientId -and $mlClientSecret) { '(Configurado)' } else { '(Pendiente)' })" -ForegroundColor $(if ($mlClientId -and $mlClientSecret) { 'Green' } else { 'Yellow' })
    Write-Host "   ✓ GitHub $(if ($githubToken) { '(Configurado)' } else { '(Pendiente)' })" -ForegroundColor $(if ($githubToken) { 'Green' } else { 'Yellow' })
    Write-Host "   ✓ PostgreSQL (Configurado)" -ForegroundColor Green
    Write-Host "   ✓ Filesystem (Configurado)" -ForegroundColor Green
    Write-Host "   ✓ Brave Search $(if ($braveKey) { '(Configurado)' } else { '(Pendiente)' })" -ForegroundColor $(if ($braveKey) { 'Green' } else { 'Yellow' })
    Write-Host "   ✓ Vercel (URL)" -ForegroundColor Green
    Write-Host "   ✓ Railway (Configurado - requiere Railway CLI autenticado)" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 PRÓXIMOS PASOS:" -ForegroundColor Yellow
    Write-Host "   1. REINICIA CURSOR completamente" -ForegroundColor White
    Write-Host "   2. Los servidores MCP se cargarán automáticamente" -ForegroundColor White
    Write-Host "   3. Para Vercel, se te pedirá autenticación OAuth la primera vez" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ Error al guardar configuración: $_" -ForegroundColor Red
    exit 1
}
