# Railway Deployment Script for Tu Farmacia
# Run this after: railway login && railway link

param(
    [string]$Service = "all",
    [switch]$Force
)

$ROOT = "c:\Users\Pablo\Documents\GitHub\build-and-deploy-webdev-asap\pharmacy-ecommerce"

function Deploy-OrderService {
    Write-Host "Deploying order-service..." -ForegroundColor Green
    Set-Location "$ROOT\apps\order-service"

    Write-Host "Setting environment variables..." -ForegroundColor Yellow
    Write-Host "You need to set these variables manually in Railway dashboard or via CLI:"
    Write-Host "  DATABASE_URL (from Postgres)"
    Write-Host "  REDIS_URL (from Redis)"
    Write-Host "  JWT_SECRET"
    Write-Host "  MERCADOPAGO_ACCESS_TOKEN"
    Write-Host "  PORT=3003"
    Write-Host "  FRONTEND_URL=http://localhost:3000"
    Write-Host ""

    $confirm = Read-Host "Have you set all variables? (y/n)"
    if ($confirm -eq "y") {
        railway up
    }
}

function Deploy-ProductService {
    Write-Host "Deploying product-service..." -ForegroundColor Green
    Set-Location "$ROOT\apps\product-service"

    if (-not $Force) {
        Write-Host "Setting environment variables..." -ForegroundColor Yellow
        Write-Host "You need to set these variables manually:"
        Write-Host "  DATABASE_URL (from Postgres)"
        Write-Host "  JWT_SECRET"
        Write-Host "  PORT=3002"
        Write-Host ""
        $confirm = Read-Host "Have you set all variables? (y/n)"
        if ($confirm -ne "y") { return }
    }
    railway up
}

function Deploy-AuthService {
    Write-Host "Deploying auth-service..." -ForegroundColor Green
    Set-Location "$ROOT\apps\auth-service"

    Write-Host "Setting environment variables..." -ForegroundColor Yellow
    Write-Host "You need to set these variables manually:"
    Write-Host "  DATABASE_URL (from Postgres)"
    Write-Host "  JWT_SECRET"
    Write-Host "  PORT=3001"
    Write-Host ""

    $confirm = Read-Host "Have you set all variables? (y/n)"
    if ($confirm -eq "y") {
        railway up
    }
}

switch ($Service) {
    "order" { Deploy-OrderService }
    "product" { Deploy-ProductService }
    "auth" { Deploy-AuthService }
    "all" {
        Deploy-ProductService
        Deploy-OrderService
        Deploy-AuthService
    }
    default {
        Write-Host "Usage: .\deploy-railway.ps1 [-Service <order|product|auth|all>] [-Force]"
        Write-Host "Example: .\deploy-railway.ps1 -Service product -Force"
    }
}

Set-Location $ROOT
Write-Host "`nDeployment script finished!" -ForegroundColor Green
