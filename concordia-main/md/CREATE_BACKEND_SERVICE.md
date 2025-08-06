# Create Backend Service in Railway - Step by Step

## 🚀 **Step 1: Go to Railway Dashboard**

1. Visit: https://railway.app/dashboard
2. Select your **concordia** project
3. You should see your frontend service already deployed

## 🚀 **Step 2: Create Backend Service**

1. **Click "New Service"** (blue button)
2. **Select "GitHub Repo"**
3. **Choose your repository**: `francisanto/concordia`
4. **Click "Deploy Now"**

## 🚀 **Step 3: Configure Backend Service**

After Railway creates the service:

1. **Go to Settings** tab
2. **Set Root Directory** to: `backend`
3. **Set Start Command** to: `npm start`
4. **Set Port** to: `3001`
5. **Click "Save"**

## 🚀 **Step 4: Set Backend Environment Variables**

Go to **Variables** tab and add:

```
PORT=3001
FRONTEND_URL=https://concordia-production.up.railway.app
NODE_ENV=production
CONTRACT_ADDRESS=0x58ae7520F81DC3464574960B792D43A82BF0C3f1
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
GREENFIELD_ENDPOINT=https://gnfd-testnet-sp1.bnbchain.org
GREENFIELD_CHAIN_ID=5600
GREENFIELD_BUCKET=concordia-data
GREENFIELD_ACCOUNT_ADDRESS=your_greenfield_account_address
GREENFIELD_PRIVATE_KEY=your_greenfield_private_key
```

## 🚀 **Step 5: Update Frontend Environment Variables**

Go to your **Frontend Service** → **Variables** tab and update:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x58ae7520F81DC3464574960B792D43A82BF0C3f1
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app/api
```

**Replace `your-backend-service.railway.app` with your actual backend URL**

## 🚀 **Step 6: Redeploy Both Services**

1. **Redeploy Backend Service**
2. **Redeploy Frontend Service**
3. **Wait for both to be healthy**

## ✅ **What You'll Have**

- **Frontend**: `https://concordia-production.up.railway.app`
- **Backend**: `https://your-backend-service.railway.app`
- **API Health**: `https://your-backend-service.railway.app/api/health`

## 🎯 **Verification**

1. **Check backend health**: Visit your backend URL + `/api/health`
2. **Test frontend**: Visit your frontend URL
3. **Test transaction**: Try creating a group
4. **Test data persistence**: Reload the page

## 🚀 **Result**

Your full Concordia DApp will be working with:
- ✅ Frontend and backend connected
- ✅ Transactions working
- ✅ Data persistence
- ✅ Team access
- ✅ No more errors 