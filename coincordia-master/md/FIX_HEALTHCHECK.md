# Fix Healthcheck Issue - Deploy Services Separately

## 🚨 **Current Problem**
Railway is trying to run both frontend and backend in one service, causing healthcheck failures.

## ✅ **Solution: Deploy as Separate Services**

### **Step 1: Delete Current Service**
1. Go to Railway Dashboard
2. Select your current service
3. Go to Settings → Danger Zone
4. Click "Delete Service"

### **Step 2: Create Frontend Service**
1. Click "New Service" → "GitHub Repo"
2. Select your repository: `francisanto/concordia`
3. Set **Root Directory**: `.` (root directory)
4. Set **Start Command**: `npm start`
5. Deploy

### **Step 3: Create Backend Service**
1. Click "New Service" → "GitHub Repo"
2. Select same repository: `francisanto/concordia`
3. Set **Root Directory**: `backend`
4. Set **Start Command**: `npm start`
5. Deploy

### **Step 4: Set Environment Variables**

#### **Frontend Service Variables:**
```
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app
```

#### **Backend Service Variables:**
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

## 🎯 **Result**
- **Frontend**: `https://your-frontend-service.railway.app`
- **Backend**: `https://your-backend-service.railway.app`

Both services will work independently and communicate with each other!

## 🚀 **Alternative: Use Railway Auto-Detection**
1. Create new project from GitHub repo
2. Railway will automatically detect frontend and backend
3. Deploy both services automatically
4. Set environment variables
5. Get your URLs 