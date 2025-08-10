@echo off
REM Railway Deployment Script for Concordia Backend (Windows)
REM This script helps deploy the backend to Railway

echo 🚀 Starting Railway deployment for Concordia Backend...

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git repository not found. Please initialize git first:
    echo    git init
    echo    git add .
    echo    git commit -m "Initial commit"
    pause
    exit /b 1
)

REM Check if railway CLI is installed
railway --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Railway CLI not found. Please install it first:
    echo    npm install -g @railway/cli
    pause
    exit /b 1
)

REM Check if logged in to Railway
railway whoami >nul 2>&1
if errorlevel 1 (
    echo ❌ Not logged in to Railway. Please login first:
    echo    railway login
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Check if environment variables are set
echo 📋 Checking environment variables...

REM Create .env file for local testing if it doesn't exist
if not exist "backend\.env" (
    echo 📝 Creating backend\.env file...
    (
        echo # Local development environment variables
        echo PORT=3002
        echo NODE_ENV=development
        echo MONGODB_URI=mongodb://localhost:27017/concordia
        echo CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
        echo RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
        echo ADMIN_ADDRESS=0xdA13e8F82C83d14E7aa639354054B7f914cA0998
        echo ADMIN_API_KEY=80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1
        echo FRONTEND_URL=http://localhost:3000
    ) > backend\.env
    echo ✅ Created backend\.env file
)

REM Install dependencies
echo 📦 Installing dependencies...
cd backend
call npm install
cd ..

REM Deploy to Railway
echo 🚀 Deploying to Railway...
railway up

echo ✅ Deployment completed!
echo.
echo 📋 Next steps:
echo 1. Set environment variables in Railway dashboard
echo 2. Check deployment logs
echo 3. Test health endpoint: https://your-backend-url.railway.app/health
echo 4. Update frontend with new backend URL
echo.
echo 📖 For detailed instructions, see: FIX_RAILWAY_HEALTHCHECK.md
pause
