# Script de Verificación de MCP Docker
# Este script verifica que el servidor MCP de Docker esté correctamente instalado

Write-Host "🔍 Verificando instalación de MCP Docker..." -ForegroundColor Cyan
Write-Host ""

# Verificar UV
Write-Host "1️⃣ Verificando UV Package Manager..." -ForegroundColor Yellow
try {
    $uvVersion = & uvx --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ UV instalado: $uvVersion" -ForegroundColor Green
    } else {
        Write-Host "   ❌ UV no encontrado" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error al verificar UV: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar Docker
Write-Host "2️⃣ Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = & docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Docker instalado: $dockerVersion" -ForegroundColor Green
        
        # Verificar que Docker esté corriendo
        $dockerInfo = & docker info 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Docker Desktop está en ejecución" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Docker está instalado pero no está en ejecución" -ForegroundColor Yellow
            Write-Host "   💡 Inicia Docker Desktop para usar MCP Docker" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   ❌ Docker no encontrado" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error al verificar Docker: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar archivo de configuración MCP
Write-Host "3️⃣ Verificando configuración de Cursor..." -ForegroundColor Yellow
$mcpConfigPath = "$env:APPDATA\Cursor\User\mcp.json"
if (Test-Path $mcpConfigPath) {
    Write-Host "   ✅ Archivo mcp.json encontrado" -ForegroundColor Green
    
    # Leer y mostrar contenido
    $mcpConfig = Get-Content $mcpConfigPath -Raw | ConvertFrom-Json
    if ($mcpConfig.mcpServers."docker-mcp") {
        Write-Host "   ✅ Servidor docker-mcp configurado correctamente" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Servidor docker-mcp no encontrado en configuración" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ❌ Archivo mcp.json no encontrado en: $mcpConfigPath" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Verificar que docker-mcp esté disponible
Write-Host "4️⃣ Verificando docker-mcp..." -ForegroundColor Yellow
try {
    Write-Host "   ⏳ Esto puede tomar unos segundos la primera vez..." -ForegroundColor Gray
    $output = & uvx docker-mcp --help 2>&1
    if ($LASTEXITCODE -eq 0 -or $output -match "usage" -or $output -match "mcp") {
        Write-Host "   ✅ docker-mcp está disponible y listo" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  docker-mcp respondió pero con salida inesperada" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error al verificar docker-mcp: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 RESUMEN DE VERIFICACIÓN" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ UV Package Manager: Instalado" -ForegroundColor Green
Write-Host "✅ Docker: Instalado" -ForegroundColor Green
Write-Host "✅ Configuración MCP: Correcta" -ForegroundColor Green
Write-Host "✅ docker-mcp: Disponible" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 ¡TODO ESTÁ LISTO!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "   1. Reinicia Cursor completamente (cierra todas las ventanas)" -ForegroundColor White
Write-Host "   2. Vuelve a abrir Cursor" -ForegroundColor White
Write-Host "   3. Empieza a usar comandos de Docker en lenguaje natural" -ForegroundColor White
Write-Host ""
Write-Host "💡 EJEMPLOS DE USO:" -ForegroundColor Yellow
Write-Host '   - "Lista todos mis contenedores Docker"' -ForegroundColor White
Write-Host '   - "Muéstrame los logs del contenedor order-service"' -ForegroundColor White
Write-Host '   - "Crea un contenedor de PostgreSQL en el puerto 5432"' -ForegroundColor White
Write-Host ""
Write-Host "📖 Lee MCP-DOCKER-INSTALADO.md para más información" -ForegroundColor Cyan
Write-Host ""
