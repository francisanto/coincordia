# Quick Railway Deployment Guide

## 🚀 Deploy Your Concordia DApp in 5 Minutes

Since you need to deploy quickly so others can access your app, here's the fastest way:

### Step 1: Go to Railway Dashboard
1. Visit: https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `concordia-dapp backend`

### Step 2: Railway Will Auto-Detect Your Project
Railway will automatically detect that you have:
- Next.js frontend (root directory)
- Express.js backend (`backend/` directory)

### Step 3: Deploy Both Services
Railway will create two services automatically:
- **Frontend Service**: Your Next.js app
- **Backend Service**: Your Express.js server

### Step 4: Set Environment Variables
After deployment, go to each service and add these variables:

#### Frontend Variables:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app
```

#### Backend Variables:
```
PORT=3001
FRONTEND_URL=https://your-frontend-service.railway.app
NODE_ENV=production
CONTRACT_ADDRESS=your_contract_address
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
GREENFIELD_ENDPOINT=https://gnfd-testnet-sp1.bnbchain.org
GREENFIELD_CHAIN_ID=5600
GREENFIELD_BUCKET=concordia-data
GREENFIELD_ACCOUNT_ADDRESS=your_greenfield_account_address
GREENFIELD_PRIVATE_KEY=your_greenfield_private_key
```

### Step 5: Get Your URLs
1. Go to each service in Railway
2. Click on "Settings" tab
3. Copy the generated URL
4. Update the environment variables with these URLs

### Step 6: Share with Your Team
Once deployed, you'll have:
- **Frontend URL**: `https://your-frontend-service.railway.app`
- **Backend URL**: `https://your-backend-service.railway.app`

Share these URLs with your team members so they can access the app!

## 🎯 What You Get

✅ **Public URLs** - Anyone can access your app  
✅ **HTTPS/SSL** - Secure connections  
✅ **Auto-scaling** - Handles traffic automatically  
✅ **Monitoring** - Built-in logs and metrics  
✅ **Team Access** - Share with your members  

## 🔧 If You Need Help

1. **Check Logs**: Go to Railway dashboard → Service → Logs
2. **Health Check**: Visit `your-backend-url/api/health`
3. **Frontend**: Visit your frontend URL directly

## 📞 Support

- Railway Docs: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway

---

**Ready to deploy? Go to https://railway.app/dashboard and start now!** 