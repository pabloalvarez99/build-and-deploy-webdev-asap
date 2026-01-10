# Simple Railway Deployment Script
# Prerequisites:
#   1. Run: railway login
#   2. Run: railway link (and select your project)
#   3. Fill in the variables below

param(
    [string]$Service = "all"
)

$ErrorActionPreference = "Stop"

# ============================================
# CONFIGURATION - Fill these in!
# ============================================

# Get these from Railway dashboard:
$DATABASE_URL = Read-Host "PostgreSQL DATABASE_PUBLIC_URL"
$REDIS_URL = Read-Host "Redis REDIS_PUBLIC_URL"
$MP_TOKEN = Read-Host "MercadoPago ACCESS_TOKEN"

# Use default JWT secret or provide your own
$JWT_SECRET = "tu-farmacia-jwt-secret-production-min-32-chars"

# ============================================

$ROOT = "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tu Farmacia Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check login
Write-Host "Checking Railway login..." -ForegroundColor Yellow
try {
    railway whoami | Out-Null
    Write-Host "✓ Logged in to Railway" -ForegroundColor Green
} catch {
    Write-Host "✗ Not logged in. Run: railway login" -ForegroundColor Red
    exit 1
}

function Deploy-ProductService {
    Write-Host ""
    Write-Host "Deploying product-service..." -ForegroundColor Cyan
    Set-Location "$ROOT\apps\product-service"

    railway variables set DATABASE_URL="$DATABASE_URL"
    railway variables set JWT_SECRET="$JWT_SECRET"
    railway variables set PORT="3002"

    Write-Host "Uploading and building..." -ForegroundColor Yellow
    railway up

    Write-Host "✓ product-service deployed!" -ForegroundColor Green
}

function Deploy-OrderService {
    Write-Host ""
    Write-Host "Deploying order-service..." -ForegroundColor Cyan
    Set-Location "$ROOT\apps\order-service"

    railway variables set DATABASE_URL="$DATABASE_URL"
    railway variables set REDIS_URL="$REDIS_URL"
    railway variables set JWT_SECRET="$JWT_SECRET"
    railway variables set MERCADOPAGO_ACCESS_TOKEN="$MP_TOKEN"
    railway variables set PORT="3003"
    railway variables set FRONTEND_URL="http://localhost:3000"
    railway variables set WEBHOOK_URL="https://temp.com"

    Write-Host "Uploading and building..." -ForegroundColor Yellow
    railway up

    Write-Host "✓ order-service deployed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: Update WEBHOOK_URL after getting the public URL:" -ForegroundColor Yellow
    Write-Host "  railway variables set WEBHOOK_URL='https://your-order-service-url/api/webhook/mercadopago'" -ForegroundColor Cyan
}

function Deploy-AuthService {
    Write-Host ""
    Write-Host "Deploying auth-service..." -ForegroundColor Cyan
    Set-Location "$ROOT\apps\auth-service"

    railway variables set DATABASE_URL="$DATABASE_URL"
    railway variables set JWT_SECRET="$JWT_SECRET"
    railway variables set PORT="3001"

    Write-Host "Uploading and building..." -ForegroundColor Yellow
    railway up

    Write-Host "✓ auth-service deployed!" -ForegroundColor Green
}

# Deploy based on parameter
switch ($Service) {
    "product" {
        Deploy-ProductService
    }
    "order" {
        Deploy-OrderService
    }
    "auth" {
        Deploy-AuthService
    }
    "all" {
        Deploy-ProductService
        Deploy-OrderService

        $deployAuth = Read-Host "`nDeploy auth-service? (y/n)"
        if ($deployAuth -eq "y") {
            Deploy-AuthService
        }
    }
    default {
        Write-Host "Usage: .\deploy-simple.ps1 [-Service <product|order|auth|all>]" -ForegroundColor Yellow
        Write-Host "Example: .\deploy-simple.ps1 -Service product" -ForegroundColor Cyan
        exit 1
    }
}

Set-Location $ROOT

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check Railway dashboard for deployment status" -ForegroundColor White
Write-Host "2. Update WEBHOOK_URL for order-service" -ForegroundColor White
Write-Host "3. Run database migrations (see RUN-THIS.md step 8)" -ForegroundColor White
Write-Host "4. Deploy frontend to Vercel" -ForegroundColor White
Write-Host ""
