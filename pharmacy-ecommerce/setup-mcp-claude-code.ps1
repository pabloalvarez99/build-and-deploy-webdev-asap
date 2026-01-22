# setup-mcp-claude-code.ps1
# Configura MCP para Claude Code en el proyecto pharmacy-ecommerce.
# Uso: .\setup-mcp-claude-code.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host "`n=== MCP para Claude Code ===" -ForegroundColor Cyan
Write-Host "Proyecto: $ProjectRoot`n" -ForegroundColor Gray

# 1. Verificar que Claude Code está instalado
$claude = Get-Command claude -ErrorAction SilentlyContinue
if (-not $claude) {
    Write-Host "Claude Code no está instalado." -ForegroundColor Yellow
    Write-Host "Instálalo con:" -ForegroundColor Gray
    Write-Host "  irm https://claude.ai/install.ps1 | iex" -ForegroundColor White
    Write-Host "  o: winget install Anthropic.ClaudeCode`n" -ForegroundColor White
    exit 1
}
Write-Host "[OK] Claude Code instalado: $($claude.Source)" -ForegroundColor Green

# 2. Verificar .mcp.json
$mcpPath = Join-Path $ProjectRoot ".mcp.json"
if (-not (Test-Path $mcpPath)) {
    Write-Host "[!] No se encontró .mcp.json en $ProjectRoot" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] .mcp.json encontrado" -ForegroundColor Green

# 3. Listar servidores MCP configurados
Write-Host "`nServidores en .mcp.json:" -ForegroundColor Cyan
$mcp = Get-Content $mcpPath -Raw | ConvertFrom-Json
$mcp.mcpServers.PSObject.Properties | ForEach-Object {
    $name = $_.Name
    $cfg = $_.Value
    $type = if ($cfg.type) { $cfg.type } else { "stdio" }
    $url = if ($cfg.url) { $cfg.url } else { "-" }
    Write-Host "  - $name ($type) $url" -ForegroundColor Gray
}

# 4. GitHub token
if (-not $env:GITHUB_PERSONAL_ACCESS_TOKEN) {
    Write-Host "`n[!] GITHUB_PERSONAL_ACCESS_TOKEN no esta definido." -ForegroundColor Yellow
    Write-Host "    El servidor 'github' lo necesita. Para usarlo:" -ForegroundColor Gray
    Write-Host "    `$env:GITHUB_PERSONAL_ACCESS_TOKEN = 'tu_token'" -ForegroundColor White
    Write-Host "    Luego ejecuta: claude`n" -ForegroundColor White
} else {
    Write-Host "`n[OK] GITHUB_PERSONAL_ACCESS_TOKEN definido" -ForegroundColor Green
}

# 5. Como abrir Claude Code en este proyecto
Write-Host "`nPara usar MCP en Claude Code:" -ForegroundColor Cyan
Write-Host "  1. cd $ProjectRoot" -ForegroundColor White
Write-Host "  2. claude" -ForegroundColor White
Write-Host "  3. Escribe /mcp para ver estado y autenticacion.`n" -ForegroundColor White
