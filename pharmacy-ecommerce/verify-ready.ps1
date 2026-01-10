# Script de Verificación Pre-Deployment
# Verifica que todo esté listo para desplegar

$ROOT = "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce"
Set-Location $ROOT

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Verificación Pre-Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Verificar Dockerfiles
Write-Host "[1/8] Verificando Dockerfiles..." -ForegroundColor Yellow
$dockerfiles = @(
    "apps/product-service/Dockerfile",
    "apps/order-service/Dockerfile",
    "apps/auth-service/Dockerfile"
)

foreach ($file in $dockerfiles) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file FALTA" -ForegroundColor Red
        $allGood = $false
    }
}

# Verificar Railway configs
Write-Host ""
Write-Host "[2/8] Verificando Railway configs..." -ForegroundColor Yellow
$railwayConfigs = @(
    "apps/product-service/railway.toml",
    "apps/order-service/railway.toml",
    "apps/auth-service/railway.toml"
)

foreach ($file in $railwayConfigs) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file FALTA" -ForegroundColor Red
        $allGood = $false
    }
}

# Verificar migraciones
Write-Host ""
Write-Host "[3/8] Verificando migraciones..." -ForegroundColor Yellow
$migrations = @(
    "database/migrations/001_initial.sql",
    "database/migrations/002_guest_checkout.sql"
)

foreach ($file in $migrations) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file FALTA" -ForegroundColor Red
        $allGood = $false
    }
}

# Verificar Next.js config
Write-Host ""
Write-Host "[4/8] Verificando Next.js config..." -ForegroundColor Yellow
if (Test-Path "apps/web/next.config.js") {
    $nextConfig = Get-Content "apps/web/next.config.js" -Raw
    if ($nextConfig -like "*standalone*") {
        Write-Host "  ✓ Next.js configurado con output: standalone" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Next.js podría no tener output: standalone" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ next.config.js FALTA" -ForegroundColor Red
    $allGood = $false
}

# Verificar package.json
Write-Host ""
Write-Host "[5/8] Verificando package.json..." -ForegroundColor Yellow
if (Test-Path "apps/web/package.json") {
    Write-Host "  ✓ package.json existe" -ForegroundColor Green
} else {
    Write-Host "  ✗ package.json FALTA" -ForegroundColor Red
    $allGood = $false
}

# Verificar guías de deployment
Write-Host ""
Write-Host "[6/8] Verificando guías de deployment..." -ForegroundColor Yellow
$guides = @(
    "FIX-RAILWAY-DASHBOARD.md",
    "DEPLOY-FRONTEND.md",
    "CHECKLIST-FINAL.md",
    "RESUMEN-DEPLOY.md"
)

foreach ($file in $guides) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file FALTA" -ForegroundColor Red
        $allGood = $false
    }
}

# Verificar Railway CLI
Write-Host ""
Write-Host "[7/8] Verificando Railway CLI..." -ForegroundColor Yellow
try {
    $railwayVersion = railway --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Railway CLI instalado" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Railway CLI no responde correctamente" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ Railway CLI no instalado" -ForegroundColor Red
    Write-Host "    Instala con: npm install -g @railway/cli" -ForegroundColor Yellow
}

# Verificar login Railway
Write-Host ""
Write-Host "[8/8] Verificando login Railway..." -ForegroundColor Yellow
try {
    $whoami = railway whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Logged in to Railway" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ No logged in to Railway" -ForegroundColor Yellow
        Write-Host "    Ejecuta: railway login" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ No logged in to Railway" -ForegroundColor Yellow
    Write-Host "    Ejecuta: railway login" -ForegroundColor Yellow
}

# Resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ TODO LISTO PARA DEPLOYMENT" -ForegroundColor Green
    Write-Host ""
    Write-Host "Siguiente paso:" -ForegroundColor Yellow
    Write-Host "1. Abre CHECKLIST-FINAL.md" -ForegroundColor White
    Write-Host "2. Sigue los pasos para desplegar en Railway" -ForegroundColor White
    Write-Host "3. Luego despliega el frontend en Vercel" -ForegroundColor White
} else {
    Write-Host "⚠ HAY ARCHIVOS FALTANTES" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Revisa los archivos marcados con ✗ arriba" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Mostrar info de variables
Write-Host "Variables de entorno que necesitarás:" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ DATABASE_URL (ya la tienes)" -ForegroundColor Green
Write-Host "✓ REDIS_URL (ya la tienes)" -ForegroundColor Green
Write-Host "✓ JWT_SECRET (ya generado)" -ForegroundColor Green
Write-Host ""
Write-Host "⚠ Necesitas obtener:" -ForegroundColor Yellow
Write-Host "  - MERCADOPAGO_ACCESS_TOKEN (token privado)" -ForegroundColor White
Write-Host "  - MERCADOPAGO_PUBLIC_KEY (token publico)" -ForegroundColor White
Write-Host ""
