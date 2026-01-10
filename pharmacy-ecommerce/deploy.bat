@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo Tu Farmacia - Railway Deployment
echo ========================================================
echo.

:: Check if Railway CLI is installed
where railway >nul 2>nul
if %errorlevel% neq 0 (
    echo Railway CLI not found! Installing...
    npm install -g @railway/cli
)

:: Step 1: Login
echo [1/7] Logging in to Railway...
railway whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo Please complete login in browser...
    railway login
    if %errorlevel% neq 0 (
        echo Login failed! Please run: railway login
        pause
        exit /b 1
    )
)

echo Logged in successfully!
echo.

:: Step 2: Link project
echo [2/7] Linking to Railway project...
cd /d "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce"
railway link
if %errorlevel% neq 0 (
    echo Failed to link project!
    pause
    exit /b 1
)
echo.

:: Step 3: Collect variables
echo [3/7] Please provide configuration values...
echo.
set /p DB_URL="PostgreSQL DATABASE_PUBLIC_URL: "
set /p REDIS_URL="Redis REDIS_PUBLIC_URL: "
set /p MP_TOKEN="MercadoPago ACCESS_TOKEN: "
set JWT_SECRET=tu-farmacia-jwt-secret-production-min-32-chars
echo.

:: Step 4: Deploy product-service
echo [4/7] Deploying product-service...
cd apps\product-service
call railway service 2>nul
call railway variables set DATABASE_URL="%DB_URL%"
call railway variables set JWT_SECRET="%JWT_SECRET%"
call railway variables set PORT="3002"
echo Deploying...
call railway up --detach
echo product-service deployed!
echo.

:: Step 5: Deploy order-service
echo [5/7] Deploying order-service...
cd ..\order-service
call railway service 2>nul
call railway variables set DATABASE_URL="%DB_URL%"
call railway variables set REDIS_URL="%REDIS_URL%"
call railway variables set JWT_SECRET="%JWT_SECRET%"
call railway variables set MERCADOPAGO_ACCESS_TOKEN="%MP_TOKEN%"
call railway variables set PORT="3003"
call railway variables set FRONTEND_URL="http://localhost:3000"
call railway variables set WEBHOOK_URL="https://placeholder.com"
echo Deploying...
call railway up --detach
echo order-service deployed!
echo.

:: Step 6: Deploy auth-service
echo [6/7] Deploying auth-service...
set /p DEPLOY_AUTH="Deploy auth-service? (y/n): "
if /i "%DEPLOY_AUTH%"=="y" (
    cd ..\auth-service
    call railway service 2>nul
    call railway variables set DATABASE_URL="%DB_URL%"
    call railway variables set JWT_SECRET="%JWT_SECRET%"
    call railway variables set PORT="3001"
    echo Deploying...
    call railway up --detach
    echo auth-service deployed!
) else (
    echo Skipping auth-service
)
echo.

:: Step 7: Instructions
echo [7/7] Deployment initiated!
echo.
echo ========================================================
echo NEXT STEPS:
echo ========================================================
echo.
echo 1. Check Railway dashboard for deployment status
echo 2. Get order-service public URL
echo 3. Update WEBHOOK_URL:
echo    cd apps\order-service
echo    railway variables set WEBHOOK_URL="https://your-url/api/webhook/mercadopago"
echo 4. Run database migrations (see DEPLOY.md section 1.7)
echo 5. Deploy frontend to Vercel
echo.
echo Check logs: railway logs
echo Check status: railway status
echo.
echo ========================================================
echo.

cd /d "C:\Users\pablo\OneDrive\Documents\build and deploy webdev asap\pharmacy-ecommerce"
pause
