# Railway CLI Deployment Commands

Run these commands in your PowerShell terminal (open PowerShell as Administrator).

## Step 1: Login to Railway

```powershell
railway login
```

This will open your browser. Complete the authentication.

## Step 2: Navigate to Project

```powershell
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce"
```

## Step 3: Link to Your Railway Project

```powershell
railway link
```

Select your `keen-nourishment` project and `production` environment.

## Step 4: Get Database URLs

Open Railway dashboard and copy these values:

**From PostgreSQL service → Variables tab:**
- Copy `DATABASE_PUBLIC_URL`

**From Redis service → Variables tab:**
- Copy `REDIS_PUBLIC_URL`

## Step 5: Deploy product-service

```powershell
cd apps\product-service

# Create or select service
railway service

# Set variables (replace <values> with actual values from step 4)
railway variables set DATABASE_URL="<PostgreSQL DATABASE_PUBLIC_URL>"
railway variables set JWT_SECRET="tu-farmacia-jwt-secret-production-min-32-chars"
railway variables set PORT="3002"

# Deploy
railway up
```

Wait for deployment to finish. You'll see "Build successful" and "Deployment live".

## Step 6: Deploy order-service

```powershell
cd ..\order-service

# Create or select service
railway service

# Set variables (replace <values> with your actual values)
railway variables set DATABASE_URL="<PostgreSQL DATABASE_PUBLIC_URL>"
railway variables set REDIS_URL="<Redis REDIS_PUBLIC_URL>"
railway variables set JWT_SECRET="tu-farmacia-jwt-secret-production-min-32-chars"
railway variables set MERCADOPAGO_ACCESS_TOKEN="<your-mercadopago-token>"
railway variables set PORT="3003"
railway variables set FRONTEND_URL="http://localhost:3000"
railway variables set WEBHOOK_URL="https://temporary.com"

# Deploy
railway up
```

Wait for deployment to finish.

## Step 7: Update Webhook URL

After order-service deploys successfully:

1. Get the public URL from Railway dashboard (e.g., `order-service-production.up.railway.app`)
2. Update the webhook URL:

```powershell
railway variables set WEBHOOK_URL="https://<your-order-service-url>/api/webhook/mercadopago"
```

## Step 8: Deploy auth-service (Optional)

```powershell
cd ..\auth-service

# Create or select service
railway service

# Set variables
railway variables set DATABASE_URL="<PostgreSQL DATABASE_PUBLIC_URL>"
railway variables set JWT_SECRET="tu-farmacia-jwt-secret-production-min-32-chars"
railway variables set PORT="3001"

# Deploy
railway up
```

## Step 9: Run Database Migrations

```powershell
# Connect to PostgreSQL and run migrations
```

In Railway dashboard:
1. Open PostgreSQL service
2. Click "Connect" → "Query"
3. Copy contents of `database/migrations/001_initial.sql`
4. Paste and execute

## Step 10: Verify Deployments

Check each service health endpoint:

```powershell
# Get service URLs from Railway dashboard, then test:
curl https://product-service-url.railway.app/health
curl https://order-service-url.railway.app/health
curl https://auth-service-url.railway.app/health
```

All should return: `OK`

## Step 11: Deploy Frontend to Vercel

```powershell
cd ..\web

# Install Vercel CLI if not already installed
npm install -g vercel

# Login
vercel login

# Deploy
vercel
```

Follow the prompts:
- Setup and deploy: Yes
- Scope: Your account
- Link to existing project: No
- Project name: tu-farmacia
- Directory: `./`
- Override settings: No

Then set environment variables in Vercel dashboard:

```
NEXT_PUBLIC_PRODUCT_SERVICE_URL=https://product-service-url.railway.app
NEXT_PUBLIC_ORDER_SERVICE_URL=https://order-service-url.railway.app
NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-service-url.railway.app
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=<your-mp-public-key>
```

Redeploy after setting variables:

```powershell
vercel --prod
```

## Deployment Complete!

Your app is now live:
- Frontend: https://your-app.vercel.app
- Backend services: Running on Railway

Update order-service `FRONTEND_URL` variable to your Vercel URL:

```powershell
cd ..\..\apps\order-service
railway variables set FRONTEND_URL="https://your-app.vercel.app"
```

## Troubleshooting

### View logs
```powershell
railway logs
```

### Check service status
```powershell
railway status
```

### Redeploy a service
```powershell
railway up
```

### List all variables
```powershell
railway variables
```
