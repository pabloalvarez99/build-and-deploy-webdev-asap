# Actualiza el Root Directory del proyecto tu-farmacia en Vercel.
# Uso: $env:VERCEL_TOKEN = "tu_token"; .\scripts\vercel-set-root-directory.ps1
# Token: https://vercel.com/account/tokens

$projectId = "prj_OfRAgKGzo9TrgQY1C2isbIzVrIs7"
$teamId = "team_slBDUpChUWbGxQNGQWmWull3"
$rootDir = "pharmacy-ecommerce/apps/web"

if (-not $env:VERCEL_TOKEN) {
    Write-Host "Configura VERCEL_TOKEN (https://vercel.com/account/tokens)" -ForegroundColor Yellow
    exit 1
}

$body = @{ rootDirectory = $rootDir } | ConvertTo-Json
$headers = @{
    "Authorization" = "Bearer $env:VERCEL_TOKEN"
    "Content-Type"  = "application/json"
}

$uri = "https://api.vercel.com/v9/projects/$projectId`?teamId=$teamId"
try {
    $r = Invoke-RestMethod -Uri $uri -Method PATCH -Headers $headers -Body $body
    Write-Host "OK. Root Directory = $rootDir" -ForegroundColor Green
    Write-Host "Redeploya desde Vercel o haz push para que el build use la nueva ruta."
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
