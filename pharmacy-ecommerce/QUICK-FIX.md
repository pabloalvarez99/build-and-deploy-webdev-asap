# Quick Fix for Current Railway Deployment

Your deployment is failing because **Root Directory is not set**. Railway is trying to build the entire monorepo instead of the individual service.

## Fix in 3 Steps:

### Step 1: Fix the Service Settings

1. In Railway dashboard, click on `build-and-deploy-webdev-asap` service
2. Go to **Settings** tab
3. Scroll to **Service** section
4. Click **Root Directory** field
5. Enter: `apps/order-service`
6. Click **Save**

### Step 2: Add Missing Environment Variables

1. Click **Variables** tab
2. Click **+ New Variable** and add each of these:

```
DATABASE_URL
```
Copy the value from: Postgres service > Variables tab > `DATABASE_PUBLIC_URL`

```
REDIS_URL
```
Copy the value from: Redis service > Variables tab > `REDIS_PUBLIC_URL`

```
JWT_SECRET
```
Value: `tu-farmacia-jwt-secret-key-min-32-chars-change-this`

```
MERCADOPAGO_ACCESS_TOKEN
```
Value: Your MercadoPago access token

```
PORT
```
Value: `3003`

```
FRONTEND_URL
```
Value: `http://localhost:3000` (update after Vercel deploy)

### Step 3: Redeploy

1. Go back to **Deployments** tab
2. Click **Deploy** button (top right corner)
3. Wait for deployment to complete
4. Check logs - should see: "Server running on 0.0.0.0:3003"

## Verify It Works

Once deployed successfully:

1. Copy the public URL (e.g., `order-service-production-abc.up.railway.app`)
2. Test in browser: `https://that-url/health`
3. Should return: `OK`

## Next: Deploy Other Services

Repeat the same steps for `product-service` and `auth-service`:

**product-service:**
- Root Directory: `apps/product-service`
- Variables: `DATABASE_URL`, `JWT_SECRET`, `PORT=3002`

**auth-service (optional for guest checkout):**
- Root Directory: `apps/auth-service`
- Variables: `DATABASE_URL`, `JWT_SECRET`, `PORT=3001`

## After All Services Deploy

Update order-service variables:
```
WEBHOOK_URL = https://your-order-service-url.railway.app/api/webhook/mercadopago
```

Then run database migrations (see DEPLOY.md step 1.7).
