#!/bin/bash

# Railway Deployment Script for Concordia Backend
# This script helps deploy the backend to Railway

echo "🚀 Starting Railway deployment for Concordia Backend..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Please login first:"
    echo "   railway login"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Check if environment variables are set
echo "📋 Checking environment variables..."

# Create .env file for local testing if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env file..."
    cat > backend/.env << EOF
# Local development environment variables
PORT=3002
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/concordia
CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
ADMIN_ADDRESS=0xdA13e8F82C83d14E7aa639354054B7f914cA0998
ADMIN_API_KEY=80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1
FRONTEND_URL=http://localhost:3000
EOF
    echo "✅ Created backend/.env file"
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd backend
npm install
cd ..

# Test local server
echo "🧪 Testing local server..."
cd backend
timeout 10s npm start &
SERVER_PID=$!
sleep 5

# Test health endpoint
if curl -f http://localhost:3002/health > /dev/null 2>&1; then
    echo "✅ Local server test passed"
    kill $SERVER_PID 2>/dev/null
else
    echo "❌ Local server test failed"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi
cd ..

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "1. Set environment variables in Railway dashboard"
echo "2. Check deployment logs"
echo "3. Test health endpoint: https://your-backend-url.railway.app/health"
echo "4. Update frontend with new backend URL"
echo ""
echo "📖 For detailed instructions, see: FIX_RAILWAY_HEALTHCHECK.md" 