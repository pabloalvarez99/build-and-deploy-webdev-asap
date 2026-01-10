# Railway Deployment - START HERE

## Prerequisites

You need these values from Railway Dashboard (open https://railway.app):

1. **PostgreSQL service** → Variables tab → `DATABASE_PUBLIC_URL`
2. **Redis service** → Variables tab → `REDIS_PUBLIC_URL`
3. Your **MercadoPago access token**

## Step 1: Open PowerShell

Open PowerShell in this directory or run:

```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce"
```

## Step 2: Login to Railway

```powershell
railway login
```

Your browser will open - complete the login.

## Step 3: Link Your Project

```powershell
railway link
```

Select:
- Project: `keen-nourishment`
- Environment: `production`

## Step 4: Deploy product-service

```powershell
cd apps\product-service

# Set your DATABASE_PUBLIC_URL from Railway
$DB = "postgresql://..."  # PASTE YOUR VALUE HERE
railway variables set DATABASE_URL="$DB"
railway variables set JWT_SECRET="tu-farmacia-jwt-secret-production-min-32-chars"
railway variables set PORT="3002"

# Deploy
railway up
```

Wait for "Deployment successful" ✓

## Step 5: Deploy order-service

```powershell
cd ..\order-service

# Set your values here
$DB = "postgresql://..."      # PASTE DATABASE_PUBLIC_URL
$REDIS = "redis://..."         # PASTE REDIS_PUBLIC_URL
$MP = "TEST-your-token..."     # PASTE MERCADOPAGO TOKEN

railway variables set DATABASE_URL="$DB"
railway variables set REDIS_URL="$REDIS"
railway variables set JWT_SECRET="tu-farmacia-jwt-secret-production-min-32-chars"
railway variables set MERCADOPAGO_ACCESS_TOKEN="$MP"
railway variables set PORT="3003"
railway variables set FRONTEND_URL="http://localhost:3000"
railway variables set WEBHOOK_URL="https://temp.com"

# Deploy
railway up
```

Wait for "Deployment successful" ✓

## Step 6: Update Webhook URL

After order-service deploys, get its public URL from Railway dashboard, then:

```powershell
# Replace with your actual order-service URL
$URL = "order-service-production-abc.up.railway.app"
railway variables set WEBHOOK_URL="https://$URL/api/webhook/mercadopago"
```

## Step 7: Deploy auth-service (Optional)

```powershell
cd ..\auth-service

$DB = "postgresql://..."  # PASTE YOUR VALUE
railway variables set DATABASE_URL="$DB"
railway variables set JWT_SECRET="tu-farmacia-jwt-secret-production-min-32-chars"
railway variables set PORT="3001"

railway up
```

## Step 8: Test Your Deployments

```powershell
# Get URLs from Railway dashboard, then test (replace with your actual URLs):
curl https://product-service-production.up.railway.app/health
curl https://order-service-production.up.railway.app/health
curl https://auth-service-production.up.railway.app/health
```

All should return: `OK`

## Step 9: Run Database Migrations

1. Go to Railway dashboard
2. Click **PostgreSQL** service
3. Click **Connect** → **Query**
4. Open this file: `database\migrations\001_initial.sql`
5. Copy all contents
6. Paste into Railway query editor
7. Click **Execute**

## Step 10: Deploy Frontend to Vercel

```powershell
cd ..\..\apps\web

# Install Vercel CLI if needed
npm install -g vercel

# Login and deploy
vercel login
vercel
```

Follow prompts, then set environment variables in Vercel dashboard:

```
NEXT_PUBLIC_PRODUCT_SERVICE_URL = https://product-service-production.up.railway.app
NEXT_PUBLIC_ORDER_SERVICE_URL = https://order-service-production.up.railway.app
NEXT_PUBLIC_AUTH_SERVICE_URL = https://auth-service-production.up.railway.app
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY = TEST-your-public-key
```

Redeploy:

```powershell
vercel --prod
```

## Step 11: Final Configuration

Update order-service with your Vercel URL:

```powershell
cd ..\..\apps\order-service
$VERCEL = "your-app.vercel.app"
railway variables set FRONTEND_URL="https://$VERCEL"
```

## ✅ Done!

Your app is live:
- Frontend: https://your-app.vercel.app
- Backend: Running on Railway

## Troubleshooting

**View logs:**
```powershell
railway logs
```

**Check status:**
```powershell
railway status
```

**List variables:**
```powershell
railway variables
```

**Redeploy:**
```powershell
railway up
```

## Need Help?

- See **RUN-THIS.md** for detailed commands
- See **RAILWAY-FIX.md** for troubleshooting
- See **README-DEPLOYMENT.md** for architecture overview
