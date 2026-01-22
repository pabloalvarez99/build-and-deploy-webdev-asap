# Script simplificado de configuracion MCP
$mcpConfigPath = "$env:APPDATA\Cursor\User\mcp.json"
$mcpDir = Split-Path $mcpConfigPath -Parent

if (-not (Test-Path $mcpDir)) {
    New-Item -ItemType Directory -Path $mcpDir -Force | Out-Null
}

# Leer configuracion base
$configPath = "C:\Users\Pablo\Documents\GitHub\build-and-deploy-webdev-asap\pharmacy-ecommerce\.claude\MCP-CONFIG-CURSOR.json"
$config = Get-Content $configPath -Raw | ConvertFrom-Json

Write-Host ""
Write-Host "=== CONFIGURACION DE SERVIDORES MCP ===" -ForegroundColor Cyan
Write-Host ""

# Solicitar credenciales
Write-Host "Servidores que requieren credenciales:" -ForegroundColor Yellow
Write-Host ""

# MercadoLibre
Write-Host "1. MercadoLibre MCP" -ForegroundColor Magenta
Write-Host "   URL: https://developers.mercadolibre.com.ar/en_us/usuarios-y-aplicaciones" -ForegroundColor Gray
$mlClientId = Read-Host "   CLIENT_ID (Enter para omitir)"
$mlClientSecret = Read-Host "   CLIENT_SECRET (Enter para omitir)"
if ($mlClientId) { $config.mcpServers.'mercadolibre-mcp'.env.CLIENT_ID = $mlClientId }
if ($mlClientSecret) { $config.mcpServers.'mercadolibre-mcp'.env.CLIENT_SECRET = $mlClientSecret }
Write-Host ""

# GitHub
Write-Host "2. GitHub MCP" -ForegroundColor Magenta
Write-Host "   URL: https://github.com/settings/tokens" -ForegroundColor Gray
$githubToken = Read-Host "   GITHUB_PERSONAL_ACCESS_TOKEN (Enter para omitir)"
if ($githubToken) { $config.mcpServers.github.env.GITHUB_PERSONAL_ACCESS_TOKEN = $githubToken }
Write-Host ""

# Brave Search
Write-Host "3. Brave Search MCP" -ForegroundColor Magenta
Write-Host "   URL: https://api-dashboard.search.brave.com/app/keys" -ForegroundColor Gray
$braveKey = Read-Host "   BRAVE_API_KEY (Enter para omitir)"
if ($braveKey) { $config.mcpServers.'brave-search'.env.BRAVE_API_KEY = $braveKey }
Write-Host ""

# Guardar
$jsonContent = $config | ConvertTo-Json -Depth 10
$jsonContent | Out-File -FilePath $mcpConfigPath -Encoding UTF8

Write-Host "=== CONFIGURACION GUARDADA ===" -ForegroundColor Green
Write-Host "Archivo: $mcpConfigPath" -ForegroundColor Gray
Write-Host ""
Write-Host "Servidores configurados:" -ForegroundColor Cyan
Write-Host "  OK MercadoPago" -ForegroundColor Green
Write-Host "  OK PostgreSQL" -ForegroundColor Green
Write-Host "  OK Filesystem" -ForegroundColor Green
Write-Host "  OK Vercel" -ForegroundColor Green
if ($mlClientId -and $mlClientSecret) {
    Write-Host "  OK MercadoLibre" -ForegroundColor Green
} else {
    Write-Host "  PENDIENTE MercadoLibre" -ForegroundColor Yellow
}
if ($githubToken) {
    Write-Host "  OK GitHub" -ForegroundColor Green
} else {
    Write-Host "  PENDIENTE GitHub" -ForegroundColor Yellow
}
if ($braveKey) {
    Write-Host "  OK Brave Search" -ForegroundColor Green
} else {
    Write-Host "  PENDIENTE Brave Search" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "REINICIA CURSOR para aplicar los cambios" -ForegroundColor Yellow
Write-Host ""
