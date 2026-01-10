# Complete Railway Deployment Script for Tu Farmacia
# This script deploys all services to Railway

$ErrorActionPreference = "Stop"
$ROOT = "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce"

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Tu Farmacia - Railway Deployment Script" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Railway login
Write-Host "[1/6] Checking Railway login..." -ForegroundColor Yellow
$whoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged in to Railway. Opening login..." -ForegroundColor Red
    railway login
    Write-Host "Please complete the login in your browser and press Enter to continue..."
    Read-Host
}

$whoami = railway whoami
Write-Host "Logged in as: $whoami" -ForegroundColor Green
Write-Host ""

# Step 2: Link to project
Write-Host "[2/6] Linking to Railway project..." -ForegroundColor Yellow
Set-Location $ROOT

# Check if already linked
$linked = railway status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not linked to a project. Please link now..." -ForegroundColor Yellow
    railway link
} else {
    Write-Host "Already linked to project" -ForegroundColor Green
}
Write-Host ""

# Get environment variables from user
Write-Host "[3/6] Setting up environment variables..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Please provide the following from your Railway dashboard:" -ForegroundColor Cyan
Write-Host ""

Write-Host "From PostgreSQL service > Variables tab:" -ForegroundColor Yellow
$DB_URL = Read-Host "DATABASE_PUBLIC_URL"

Write-Host ""
Write-Host "From Redis service > Variables tab:" -ForegroundColor Yellow
$REDIS_URL = Read-Host "REDIS_PUBLIC_URL"

Write-Host ""
Write-Host "MercadoPago configuration:" -ForegroundColor Yellow
$MP_TOKEN = Read-Host "MERCADOPAGO_ACCESS_TOKEN"

Write-Host ""
Write-Host "JWT Secret (min 32 chars, press Enter for default):" -ForegroundColor Yellow
$JWT_SECRET = Read-Host "JWT_SECRET"
if ([string]::IsNullOrWhiteSpace($JWT_SECRET)) {
    $JWT_SECRET = "tu-farmacia-jwt-secret-production-change-this-min-32-chars"
}

Write-Host ""
Write-Host "Environment variables collected!" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy product-service
Write-Host "[4/6] Deploying product-service..." -ForegroundColor Yellow
Set-Location "$ROOT\apps\product-service"

Write-Host "Creating service..." -ForegroundColor Cyan
railway service create product-service 2>$null

Write-Host "Setting variables..." -ForegroundColor Cyan
railway variables --set "DATABASE_URL=$DB_URL"
railway variables --set "JWT_SECRET=$JWT_SECRET"
railway variables --set "PORT=3002"

Write-Host "Deploying..." -ForegroundColor Cyan
railway up --detach

Write-Host "product-service deployed!" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy order-service
Write-Host "[5/6] Deploying order-service..." -ForegroundColor Yellow
Set-Location "$ROOT\apps\order-service"

Write-Host "Creating service..." -ForegroundColor Cyan
railway service create order-service 2>$null

Write-Host "Setting variables..." -ForegroundColor Cyan
railway variables --set "DATABASE_URL=$DB_URL"
railway variables --set "REDIS_URL=$REDIS_URL"
railway variables --set "JWT_SECRET=$JWT_SECRET"
railway variables --set "MERCADOPAGO_ACCESS_TOKEN=$MP_TOKEN"
railway variables --set "PORT=3003"
railway variables --set "FRONTEND_URL=http://localhost:3000"
railway variables --set "WEBHOOK_URL=https://placeholder.com"

Write-Host "Deploying..." -ForegroundColor Cyan
railway up --detach

Write-Host "order-service deployed!" -ForegroundColor Green
Write-Host ""

# Step 5: Deploy auth-service (optional)
Write-Host "[6/6] Deploying auth-service..." -ForegroundColor Yellow
$deployAuth = Read-Host "Deploy auth-service? (optional for guest checkout) (y/n)"

if ($deployAuth -eq "y") {
    Set-Location "$ROOT\apps\auth-service"

    Write-Host "Creating service..." -ForegroundColor Cyan
    railway service create auth-service 2>$null

    Write-Host "Setting variables..." -ForegroundColor Cyan
    railway variables --set "DATABASE_URL=$DB_URL"
    railway variables --set "JWT_SECRET=$JWT_SECRET"
    railway variables --set "PORT=3001"

    Write-Host "Deploying..." -ForegroundColor Cyan
    railway up --detach

    Write-Host "auth-service deployed!" -ForegroundColor Green
} else {
    Write-Host "Skipping auth-service" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait for deployments to finish (check Railway dashboard)"
Write-Host "2. Get order-service public URL from Railway"
Write-Host "3. Update order-service WEBHOOK_URL variable to: https://<url>/api/webhook/mercadopago"
Write-Host "4. Run database migrations (see DEPLOY.md section 1.7)"
Write-Host "5. Deploy frontend to Vercel"
Write-Host ""
Write-Host "Check deployment status: railway status" -ForegroundColor Cyan
Write-Host "View logs: railway logs" -ForegroundColor Cyan
Write-Host ""

Set-Location $ROOT
