# Script para verificar deployments
# Reemplaza las URLs con las reales de tu Railway

param(
    [string]$ProductUrl = "",
    [string]$OrderUrl = "",
    [string]$AuthUrl = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificación de Deployments" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-HealthEndpoint {
    param([string]$Name, [string]$Url)

    if ([string]::IsNullOrWhiteSpace($Url)) {
        Write-Host "⚠ $Name - URL no proporcionada" -ForegroundColor Yellow
        return
    }

    Write-Host "Probando $Name..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$Url/health" -Method Get -TimeoutSec 10 2>&1
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✓ $Name - OK (Status: $($response.StatusCode))" -ForegroundColor Green
            Write-Host "    Respuesta: $($response.Content)" -ForegroundColor Gray
        } else {
            Write-Host "  ✗ $Name - Error (Status: $($response.StatusCode))" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ $Name - No responde" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
    Write-Host ""
}

if ([string]::IsNullOrWhiteSpace($ProductUrl) -and
    [string]::IsNullOrWhiteSpace($OrderUrl) -and
    [string]::IsNullOrWhiteSpace($AuthUrl)) {

    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\check-deployment.ps1 -ProductUrl 'https://tu-product-service.up.railway.app' -OrderUrl 'https://tu-order-service.up.railway.app' -AuthUrl 'https://tu-auth-service.up.railway.app'" -ForegroundColor White
    Write-Host ""
    Write-Host "O proporciona las URLs cuando se te pida:" -ForegroundColor Yellow
    Write-Host ""

    $ProductUrl = Read-Host "URL de product-service (Enter para omitir)"
    $OrderUrl = Read-Host "URL de order-service (Enter para omitir)"
    $AuthUrl = Read-Host "URL de auth-service (Enter para omitir)"
}

Test-HealthEndpoint "product-service" $ProductUrl
Test-HealthEndpoint "order-service" $OrderUrl
Test-HealthEndpoint "auth-service" $AuthUrl

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificación completa" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si todos los servicios están OK:" -ForegroundColor Green
Write-Host "  ✓ Backend funcionando correctamente" -ForegroundColor Green
Write-Host ""
Write-Host "Si algún servicio falla:" -ForegroundColor Yellow
Write-Host "  1. Verifica Railway Dashboard" -ForegroundColor White
Write-Host "  2. Revisa los logs del servicio" -ForegroundColor White
Write-Host "  3. Verifica que todas las variables estén configuradas" -ForegroundColor White
Write-Host ""
