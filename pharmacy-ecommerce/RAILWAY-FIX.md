# Railway Deployment Fix

## Current Issue
The healthcheck is failing because Railway is building from the wrong directory or missing environment variables.

## Solution 1: Fix via Railway Dashboard

### For each service (order-service, product-service, auth-service):

1. **Delete the current failed service**
   - Click the service > Settings > Danger > Delete Service

2. **Create new service correctly:**
   - Click "New" > "GitHub Repo"
   - Select: `build-and-deploy-webdev-asap`
   - **IMPORTANT: Set "Root Directory"**
     - For order-service: `apps/order-service`
     - For product-service: `apps/product-service`
     - For auth-service: `apps/auth-service`

3. **Add Variables** (click Variables tab):

   **For order-service:**
   ```
   DATABASE_URL = <copy from Postgres Variables tab>
   REDIS_URL = <copy from Redis Variables tab>
   JWT_SECRET = tu-farmacia-secret-key-change-in-production-min-32-chars
   MERCADOPAGO_ACCESS_TOKEN = <your MP token>
   PORT = 3003
   WEBHOOK_URL = <leave empty, will update after deploy>
   FRONTEND_URL = http://localhost:3000
   ```

   **For product-service:**
   ```
   DATABASE_URL = <copy from Postgres Variables tab>
   JWT_SECRET = tu-farmacia-secret-key-change-in-production-min-32-chars
   PORT = 3002
   ```

   **For auth-service:**
   ```
   DATABASE_URL = <copy from Postgres Variables tab>
   JWT_SECRET = tu-farmacia-secret-key-change-in-production-min-32-chars
   PORT = 3001
   ```

4. **Deploy** - Railway will auto-deploy after adding variables

5. **After order-service deploys:**
   - Copy its public URL (e.g., `order-service-production.up.railway.app`)
   - Update `WEBHOOK_URL` variable to: `https://<that-url>/api/webhook/mercadopago`
   - Redeploy

## Solution 2: Deploy via Railway CLI

### One-time setup:
```bash
# Login (opens browser)
railway login

# Link to your project
cd "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce"
railway link
```

### Deploy order-service:
```bash
cd apps/order-service

# Set environment
railway environment production

# Add variables
railway variables set DATABASE_URL="<from railway dashboard>"
railway variables set REDIS_URL="<from railway dashboard>"
railway variables set JWT_SECRET="tu-farmacia-secret-key-change-in-production-min-32-chars"
railway variables set MERCADOPAGO_ACCESS_TOKEN="<your token>"
railway variables set PORT="3003"
railway variables set FRONTEND_URL="http://localhost:3000"

# Deploy
railway up
```

### Deploy product-service:
```bash
cd ../product-service

railway variables set DATABASE_URL="<from railway dashboard>"
railway variables set JWT_SECRET="tu-farmacia-secret-key-change-in-production-min-32-chars"
railway variables set PORT="3002"

railway up
```

### Deploy auth-service:
```bash
cd ../auth-service

railway variables set DATABASE_URL="<from railway dashboard>"
railway variables set JWT_SECRET="tu-farmacia-secret-key-change-in-production-min-32-chars"
railway variables set PORT="3001"

railway up
```

## Solution 3: Quick Fix Current Deployment

If you don't want to delete the service:

1. Go to service Settings
2. **Build section:**
   - Root Directory: `apps/order-service`
   - Dockerfile Path: `Dockerfile`
3. **Variables tab** - Add all missing variables listed above
4. Click "Redeploy" button (top right)

## Verify Deployment

After successful deploy:

1. **Check logs:**
   - Click service > Deployments > Latest > View logs
   - Should see: "Server running on 0.0.0.0:3003"

2. **Test health endpoint:**
   ```bash
   curl https://your-service.railway.app/health
   ```
   Should return: `OK`

3. **Test API:**
   ```bash
   curl https://product-service.railway.app/api/products
   ```

## Common Errors

### "Healthcheck failure"
- **Cause**: Missing PORT variable or service crashed
- **Fix**: Check logs, add all required environment variables

### "Build failed"
- **Cause**: Wrong root directory
- **Fix**: Set root directory to `apps/<service-name>`

### "Database connection failed"
- **Cause**: Wrong DATABASE_URL format
- **Fix**: Use the `DATABASE_PUBLIC_URL` from Postgres variables (starts with `postgresql://`)

### "Redis connection failed"
- **Cause**: Wrong REDIS_URL format
- **Fix**: Use the `REDIS_PUBLIC_URL` from Redis variables (starts with `redis://`)
