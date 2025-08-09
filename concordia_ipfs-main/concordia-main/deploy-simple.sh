#!/bin/bash

echo "🚀 Deploying Concordia DApp to Railway..."

# Install Railway CLI if not installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "Logging in to Railway..."
railway login

# Deploy the project
echo "Deploying project..."
railway up

echo "✅ Deployment completed!"
echo ""
echo "Next steps:"
echo "1. Go to Railway Dashboard: https://railway.app/dashboard"
echo "2. Set environment variables in the Variables tab"
echo "3. Get your deployment URLs"
echo "4. Share the URLs with your team members" 