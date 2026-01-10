# Tu Farmacia - Deployment Guide

## Quick Start

Choose your preferred method:

### Option 1: Step-by-Step Commands (Recommended)

Follow **RUN-THIS.md** - Copy and paste commands one at a time.

### Option 2: PowerShell Script

1. Open PowerShell in this directory
2. Run:
   ```powershell
   railway login
   railway link
   .\deploy-simple.ps1
   ```

### Option 3: Manual via Railway Dashboard

Follow **QUICK-FIX.md** - Configure services through the web UI.

## Files Overview

- **RUN-THIS.md** - Step-by-step command guide (easiest)
- **DEPLOY.md** - Complete deployment documentation
- **QUICK-FIX.md** - Fix current failed deployment
- **RAILWAY-FIX.md** - Troubleshooting guide
- **DEPLOY-COMMANDS.md** - CLI reference
- **deploy-simple.ps1** - Automated PowerShell script
- **deploy-all.ps1** - Full deployment automation
- **deploy.bat** - Windows batch script
- **.env.railway.template** - Environment variables template

## Prerequisites

1. Railway account with project created
2. PostgreSQL and Redis services added to Railway project
3. Railway CLI installed: `npm install -g @railway/cli`
4. Vercel account (for frontend)
5. MercadoPago credentials

## Architecture

```
┌─────────────────┐         ┌──────────────────────┐
│  Vercel         │         │  Railway             │
│  ┌───────────┐  │         │  ┌────────────────┐  │
│  │ Next.js   │──┼────────▶│  │ product-service│  │
│  │ Frontend  │  │         │  └────────────────┘  │
│  └───────────┘  │         │  ┌────────────────┐  │
└─────────────────┘         │  │ order-service  │  │
                            │  └────────────────┘  │
                            │  ┌────────────────┐  │
                            │  │ auth-service   │  │
                            │  └────────────────┘  │
                            │  ┌────────────────┐  │
                            │  │  PostgreSQL    │  │
                            │  └────────────────┘  │
                            │  ┌────────────────┐  │
                            │  │     Redis      │  │
                            │  └────────────────┘  │
                            └──────────────────────┘
```

## Services

### Backend (Railway)

1. **product-service** (Port 3002)
   - Manages products and categories
   - Variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`

2. **order-service** (Port 3003)
   - Handles orders, cart, and MercadoPago integration
   - Variables: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `MERCADOPAGO_ACCESS_TOKEN`, `PORT`, `FRONTEND_URL`, `WEBHOOK_URL`

3. **auth-service** (Port 3001) - Optional for guest checkout
   - User authentication and JWT management
   - Variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`

### Frontend (Vercel)

- Next.js 14 application with standalone output
- Variables: API service URLs, MercadoPago public key

## Deployment Order

1. Deploy backend services to Railway (product → order → auth)
2. Run database migrations
3. Deploy frontend to Vercel
4. Update service URLs in environment variables

## Environment Variables

### Required from Railway Dashboard

- **DATABASE_PUBLIC_URL**: PostgreSQL service → Variables
- **REDIS_PUBLIC_URL**: Redis service → Variables

### Required from MercadoPago

- **MERCADOPAGO_ACCESS_TOKEN**: Private key for server
- **MERCADOPAGO_PUBLIC_KEY**: Public key for frontend

### Generated

- **JWT_SECRET**: 32+ character secret string (same across all services)

## Testing

After deployment, test each service:

```bash
# Health checks
curl https://product-service-url.railway.app/health
curl https://order-service-url.railway.app/health
curl https://auth-service-url.railway.app/health

# API endpoints
curl https://product-service-url.railway.app/api/products
```

## Troubleshooting

### Deployment Fails

1. Check logs: `railway logs`
2. Verify all environment variables are set: `railway variables`
3. Ensure root directory is set correctly in service settings

### Database Connection Errors

- Use `DATABASE_PUBLIC_URL` not `DATABASE_URL`
- URL should start with `postgresql://`

### Healthcheck Failures

- Service crashed - check logs
- Missing PORT environment variable
- Root directory not set in Railway settings

### CORS Errors

- All services have CORS enabled for any origin
- Check if service URLs are correct in frontend

## Support Files

- **database/migrations/001_initial.sql** - Database schema
- **Dockerfile** (in each service) - Container configuration
- **railway.toml** (in each service) - Railway configuration

## Quick Commands

```powershell
# Login
railway login

# Link project
railway link

# Check status
railway status

# View logs
railway logs

# Deploy
railway up

# List variables
railway variables

# Set variable
railway variables set KEY="value"
```

## Next Steps After Deployment

1. Configure custom domain (optional)
2. Set up monitoring and alerts
3. Enable database backups
4. Configure MercadoPago webhooks in MP dashboard
5. Test complete checkout flow
6. Update MercadoPago to production mode

## Contact

- Railway: https://railway.app
- Vercel: https://vercel.com
- MercadoPago: https://www.mercadopago.com.cl/developers
