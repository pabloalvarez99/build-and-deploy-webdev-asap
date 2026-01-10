# Run These Commands in PowerShell

Open PowerShell and copy-paste these commands one section at a time.

## 1. Login to Railway

```powershell
railway login
```

**→ Complete the browser login, then continue**

## 2. Navigate and Link Project

```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce"
railway link
```

**→ Select:** `keen-nourishment` project and `production` environment

## 3. Get Your Database URLs

Open Railway dashboard in browser and copy these values:

- **PostgreSQL service** → Variables tab → Copy `DATABASE_PUBLIC_URL`
- **Redis service** → Variables tab → Copy `REDIS_PUBLIC_URL`

## 4. Deploy product-service

```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce\apps\product-service"
```

**Set variables (replace the placeholder values):**

```powershell
$DB_URL = "YOUR_POSTGRES_DATABASE_PUBLIC_URL_HERE"
railway variables set DATABASE_URL="$DB_URL"
railway variables set JWT_SECRET="tu-farmacia-jwt-secret-production-min-32-chars"
railway variables set PORT="3002"
```

**Deploy:**

```powershell
railway up
```

**→ Wait for "Deployment successful"**

## 5. Deploy order-service

```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce\apps\order-service"
```

**Set variables (replace the placeholder values):**

```powershell
$DB_URL = "YOUR_POSTGRES_DATABASE_PUBLIC_URL_HERE"
$REDIS_URL = "YOUR_REDIS_REDIS_PUBLIC_URL_HERE"
$MP_TOKEN = "YOUR_MERCADOPAGO_ACCESS_TOKEN_HERE"

railway variables set DATABASE_URL="$DB_URL"
railway variables set REDIS_URL="$REDIS_URL"
railway variables set JWT_SECRET="tu-farmacia-jwt-secret-production-min-32-chars"
railway variables set MERCADOPAGO_ACCESS_TOKEN="$MP_TOKEN"
railway variables set PORT="3003"
railway variables set FRONTEND_URL="http://localhost:3000"
railway variables set WEBHOOK_URL="https://temp.com"
```

**Deploy:**

```powershell
railway up
```

**→ Wait for "Deployment successful"**

## 6. Get order-service URL and Update Webhook

After order-service deploys:

1. Go to Railway dashboard
2. Click order-service → Settings → Copy the public domain (e.g., `order-service-production-abc123.up.railway.app`)
3. Run this command (replace with your actual URL):

```powershell
$ORDER_URL = "order-service-production-abc123.up.railway.app"
railway variables set WEBHOOK_URL="https://$ORDER_URL/api/webhook/mercadopago"
```

## 7. Deploy auth-service (Optional)

```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce\apps\auth-service"
```

**Set variables:**

```powershell
$DB_URL = "YOUR_POSTGRES_DATABASE_PUBLIC_URL_HERE"
railway variables set DATABASE_URL="$DB_URL"
railway variables set JWT_SECRET="tu-farmacia-jwt-secret-production-min-32-chars"
railway variables set PORT="3001"
```

**Deploy:**

```powershell
railway up
```

## 8. Run Database Migrations

In Railway dashboard:
1. Open **PostgreSQL** service
2. Click **Connect** → **Query**
3. Open file: `C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce\database\migrations\001_initial.sql`
4. Copy all contents and paste into Railway query editor
5. Click **Execute**

## 9. Test Your Services

```powershell
# Get URLs from Railway dashboard, then test
curl https://product-service-url.railway.app/health
curl https://order-service-url.railway.app/health
curl https://auth-service-url.railway.app/health
```

All should return: `OK`

## 10. Deploy Frontend to Vercel

```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce\apps\web"

# Install Vercel CLI if needed
npm install -g vercel

# Login and deploy
vercel login
vercel
```

**Set these environment variables in Vercel dashboard:**

```
NEXT_PUBLIC_PRODUCT_SERVICE_URL = https://product-service-url.railway.app
NEXT_PUBLIC_ORDER_SERVICE_URL = https://order-service-url.railway.app
NEXT_PUBLIC_AUTH_SERVICE_URL = https://auth-service-url.railway.app
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY = <your-mp-public-key>
```

**Redeploy with production flag:**

```powershell
vercel --prod
```

## 11. Final Configuration

Update order-service with Vercel URL:

```powershell
cd ..\order-service
$VERCEL_URL = "your-app.vercel.app"
railway variables set FRONTEND_URL="https://$VERCEL_URL"
```

## Done!

Your Tu Farmacia app is now live at: `https://your-app.vercel.app`

---

## Quick Reference

**View logs:**
```powershell
railway logs
```

**Check status:**
```powershell
railway status
```

**Redeploy:**
```powershell
railway up
```

**List variables:**
```powershell
railway variables
```
