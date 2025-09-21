# Deploy Backend Separately

## 🚀 Deploy Backend to Railway

Since the frontend is now deployed, let's deploy the backend as a separate service:

### Step 1: Create New Service for Backend
1. Go to your Railway project dashboard
2. Click "New Service" → "GitHub Repo"
3. Select the same repository: `francisanto/concordia`
4. Set the **Root Directory** to: `backend`

### Step 2: Configure Backend Service
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: `3001`

### Step 3: Set Backend Environment Variables
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

### Step 4: Update Frontend Environment Variables
After backend is deployed, update the frontend service with:
```
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app
```

## 🎯 Result
You'll have:
- **Frontend**: `https://your-frontend-service.railway.app`
- **Backend**: `https://your-backend-service.railway.app`

Both services will work independently and communicate with each other! 