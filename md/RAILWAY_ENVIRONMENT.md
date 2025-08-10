# Railway Environment Setup - FIX ALL ISSUES

## 🚨 **Current Problems**
1. ❌ App trying to connect to localhost instead of Railway
2. ❌ Data lost on page reload
3. ❌ Transaction failures
4. ❌ Missing backend service

## ✅ **Complete Fix**

### **Step 1: Create Backend Service**

1. **Go to Railway Dashboard**
2. **Click "New Service"** → "GitHub Repo"
3. **Select repository**: `francisanto/concordia`
4. **Set Root Directory**: `backend`
5. **Set Start Command**: `npm start`
6. **Deploy**

### **Step 2: Set Frontend Environment Variables**

Go to your **Frontend Service** → Variables tab and add:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x58ae7520F81DC3464574960B792D43A82BF0C3f1
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app/api
```

### **Step 3: Set Backend Environment Variables**

Go to your **Backend Service** → Variables tab and add:

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

### **Step 4: Redeploy Both Services**

1. **Redeploy Frontend Service**
2. **Redeploy Backend Service**
3. **Wait for both to be healthy**

## 🎯 **What This Fixes**

✅ **No more localhost**: All connections go to Railway  
✅ **Data persistence**: Stored in Railway backend  
✅ **Transaction success**: Proper contract configuration  
✅ **No data loss**: Backend handles all data storage  
✅ **Reload safe**: Data persists across page reloads  

## 🔧 **Backend Service Configuration**

Make sure your backend service has:
- **Root Directory**: `backend`
- **Start Command**: `npm start`
- **Port**: `3001`
- **Health Check**: `/api/health`

## 🚀 **Result**

After this setup:
- ✅ **Transactions will work**
- ✅ **Data will persist**
- ✅ **No more localhost errors**
- ✅ **Page reloads won't lose data**
- ✅ **Your team can use the app**

## 📋 **Verification**

1. **Check backend health**: Visit `your-backend-url/api/health`
2. **Test transaction**: Try creating a group
3. **Reload page**: Data should persist
4. **Check logs**: No localhost errors

**Your Concordia DApp will work perfectly with persistent data!** 