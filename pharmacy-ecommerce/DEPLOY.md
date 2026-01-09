# Deploy Guide: Tu Farmacia

## Architecture

```
Vercel (Frontend)           Railway (Backend)
+------------------+        +------------------+
|   Next.js Web    | -----> | auth-service     |
|   (tu-farmacia)  |        | product-service  |
+------------------+        | order-service    |
                            | PostgreSQL       |
                            | Redis            |
                            +------------------+
```

## Step 1: Railway Setup

### 1.1 Create Railway Project

1. Go to [railway.app](https://railway.app) and sign up/login
2. Click "New Project" > "Empty Project"
3. Name it "tu-farmacia"

### 1.2 Add PostgreSQL

1. Click "New" > "Database" > "PostgreSQL"
2. Wait for it to deploy
3. Copy the `DATABASE_URL` from Variables tab

### 1.3 Add Redis

1. Click "New" > "Database" > "Redis"
2. Wait for it to deploy
3. Copy the `REDIS_URL` from Variables tab

### 1.4 Deploy product-service

1. Click "New" > "GitHub Repo"
2. Select your repo and set root directory: `apps/product-service`
3. Add environment variables:
   - `DATABASE_URL` (from PostgreSQL)
   - `JWT_SECRET` (generate secure string)
   - `SERVER_PORT=3002`
4. Deploy

### 1.5 Deploy order-service

1. Click "New" > "GitHub Repo"
2. Select your repo and set root directory: `apps/order-service`
3. Add environment variables:
   - `DATABASE_URL` (from PostgreSQL)
   - `REDIS_URL` (from Redis)
   - `JWT_SECRET` (same as product-service)
   - `MERCADOPAGO_ACCESS_TOKEN` (production token)
   - `FRONTEND_URL` (will update after Vercel deploy)
   - `WEBHOOK_URL` (Railway URL of this service)
   - `SERVER_PORT=3003`
4. Deploy

### 1.6 Deploy auth-service (optional for guest checkout)

1. Click "New" > "GitHub Repo"
2. Select your repo and set root directory: `apps/auth-service`
3. Add environment variables:
   - `DATABASE_URL` (from PostgreSQL)
   - `JWT_SECRET` (same as others)
   - `SERVER_PORT=3001`
4. Deploy

### 1.7 Run Database Migrations

1. Open PostgreSQL service in Railway
2. Click "Connect" > "Query"
3. Copy and run contents of `database/migrations/001_initial.sql`

## Step 2: Vercel Setup

### 2.1 Deploy Frontend

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New" > "Project"
3. Import your GitHub repo
4. Set root directory: `apps/web`
5. Framework Preset: Next.js
6. Add environment variables:
   - `NEXT_PUBLIC_PRODUCT_SERVICE_URL` (Railway product-service URL)
   - `NEXT_PUBLIC_ORDER_SERVICE_URL` (Railway order-service URL)
   - `NEXT_PUBLIC_AUTH_SERVICE_URL` (Railway auth-service URL)
   - `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` (your production public key)
7. Deploy

### 2.2 Update Railway Variables

After Vercel deploy, update order-service on Railway:
- `FRONTEND_URL=https://your-app.vercel.app`

## Step 3: MercadoPago Production

1. Go to [mercadopago.com.cl](https://www.mercadopago.com.cl/developers/panel)
2. Create production credentials
3. Update `MERCADOPAGO_ACCESS_TOKEN` in Railway order-service
4. Update `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` in Vercel

## Step 4: Custom Domain (Optional)

### Vercel
1. Go to Project Settings > Domains
2. Add your domain (e.g., tufarmacia.cl)
3. Update DNS records as instructed

### Railway
1. Go to Service Settings > Custom Domain
2. Add domain for API (e.g., api.tufarmacia.cl)
3. Update DNS records

## Environment Variables Reference

### product-service
| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Shared secret for JWT validation |
| SERVER_PORT | 3002 |

### order-service
| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| REDIS_URL | Redis connection string |
| JWT_SECRET | Shared secret for JWT validation |
| MERCADOPAGO_ACCESS_TOKEN | MercadoPago production token |
| FRONTEND_URL | Vercel frontend URL |
| WEBHOOK_URL | This service's public URL |
| SERVER_PORT | 3003 |

### auth-service
| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Shared secret for JWT validation |
| SERVER_PORT | 3001 |

### web (Vercel)
| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_PRODUCT_SERVICE_URL | Railway product-service URL |
| NEXT_PUBLIC_ORDER_SERVICE_URL | Railway order-service URL |
| NEXT_PUBLIC_AUTH_SERVICE_URL | Railway auth-service URL |
| NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY | MercadoPago public key |

## Verification Checklist

- [ ] PostgreSQL connected (check health endpoint)
- [ ] Redis connected (check order-service logs)
- [ ] Products load on homepage
- [ ] Add to cart works
- [ ] Guest checkout creates order
- [ ] MercadoPago redirect works
- [ ] Payment webhook updates order status

## Troubleshooting

### CORS Errors
All Rust services have CORS configured to allow any origin. If you see CORS errors, check the service logs.

### Database Connection
Ensure DATABASE_URL uses `postgresql://` prefix, not `postgres://`.

### MercadoPago Webhook
1. Webhook URL must be HTTPS
2. URL format: `https://order-service.railway.app/api/webhook/mercadopago`
3. Check MercadoPago dashboard for webhook logs
