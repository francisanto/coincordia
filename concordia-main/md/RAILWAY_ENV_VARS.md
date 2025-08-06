# Railway Environment Variables - FIXED

## 🎯 **Your Deployed Contract**
- **Contract Address**: `0x58ae7520F81DC3464574960B792D43A82BF0C3f1`
- **Network**: opBNB Testnet
- **Deployer**: `0xdA13e8F82C83d14E7aa639354054B7f914cA0998`

## 🔧 **Frontend Service Variables**

Go to your Railway dashboard → Frontend Service → Variables tab and add:

```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x58ae7520F81DC3464574960B792D43A82BF0C3f1
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app
```

## 🔧 **Backend Service Variables**

First, create a backend service:
1. Go to Railway Dashboard
2. Click "New Service" → "GitHub Repo"
3. Select your repository: `francisanto/concordia`
4. Set **Root Directory** to: `backend`
5. Set **Start Command** to: `npm start`

Then add these variables to the backend service:

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

## 🚀 **After Setting Variables**

1. **Redeploy both services**
2. **Update frontend API URL** with your backend service URL
3. **Test the transaction** - it should work now!

## ✅ **What This Fixes**

- ✅ **Contract Address**: Correct address from your deployment
- ✅ **Network**: Proper opBNB testnet configuration
- ✅ **API Connection**: Frontend can communicate with backend
- ✅ **Transactions**: Smart contract calls will work

## 🎯 **Result**

Your Concordia DApp will work properly and transactions will succeed! 