# Script para configurar variables de Stripe en Railway
# Ejecutar después de: railway login

Write-Host "=== Configurando Stripe en Railway ===" -ForegroundColor Cyan

# Verificar si está logueado
$whoami = railway whoami 2>&1
if ($whoami -match "Unauthorized") {
    Write-Host "Error: No estas logueado en Railway" -ForegroundColor Red
    Write-Host "Ejecuta: railway login" -ForegroundColor Yellow
    exit 1
}

Write-Host "Logueado como: $whoami" -ForegroundColor Green

# Linkar al proyecto
Write-Host "`nLinkando proyecto..." -ForegroundColor Yellow
railway link

# Configurar variables de Stripe
Write-Host "`nConfigurando variables de Stripe..." -ForegroundColor Yellow

$stripeSecretKey = "sk_test_51RsUUTFWMnoouNk2bXSeQoy6mQZxPS3psEVVk96Kn79wb5UrrFnMp6OwVdGQAPTNUzAfybGakwunAyOq6p8dQwOt00jFKvDWlQ"
$stripeWebhookSecret = "whsec_qVUy2U7yeIDWKpM8dyLgLSaXTvAd7KjG"

railway variables set STRIPE_SECRET_KEY="$stripeSecretKey"
railway variables set STRIPE_WEBHOOK_SECRET="$stripeWebhookSecret"

Write-Host "`n✅ Variables configuradas!" -ForegroundColor Green
Write-Host "Railway redesplegara automaticamente el servicio." -ForegroundColor Cyan

Write-Host "`n=== Resumen ===" -ForegroundColor Cyan
Write-Host "STRIPE_SECRET_KEY: sk_test_...DWlQ" -ForegroundColor Gray
Write-Host "STRIPE_WEBHOOK_SECRET: whsec_...7KjG" -ForegroundColor Gray
