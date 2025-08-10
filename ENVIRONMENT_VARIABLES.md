# 🔧 Environment Variables Reference

## 📋 Quick Reference

### 🎯 Contract Information
- **Contract Address**: `0xe93ECeA7f56719e60cb03fc1608A5830793D95FF`
- **Network**: opBNB Testnet
- **Chain ID**: `5611`
- **RPC URL**: `https://opbnb-testnet-rpc.bnbchain.org`

### 🔑 Admin Information
- **Admin Address**: `0xdA13e8F82C83d14E7aa639354054B7f914cA0998`
- **Admin API Key**: `80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1`

## 🚂 Railway Backend Variables

```env
# Server Configuration
PORT=3002
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.railway.app

# Smart Contract Configuration
CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org

# MongoDB Configuration (REPLACE WITH YOUR CONNECTION STRING)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/concordia?retryWrites=true&w=majority

# Admin Configuration
ADMIN_ADDRESS=0xdA13e8F82C83d14E7aa639354054B7f914cA0998
ADMIN_API_KEY=80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1

# Optional Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key
```

## 🌐 Railway Frontend Variables

```env
# Smart Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_CHAIN_ID=5611

# Backend API Configuration (REPLACE WITH YOUR BACKEND URL)
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app

# Admin Configuration
ADMIN_API_KEY=80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1
```

## 📁 Local Development Files

### Frontend (.env.local)
Create this file in the root directory:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_CHAIN_ID=5611
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app
```

### Backend (.env)
Create this file in the backend directory:
```env
PORT=3002
FRONTEND_URL=https://your-frontend-domain.railway.app
NODE_ENV=development
CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/concordia?retryWrites=true&w=majority
ADMIN_ADDRESS=0xdA13e8F82C83d14E7aa639354054B7f914cA0998
ADMIN_API_KEY=80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1
```

## 🔄 Update Process

### After Backend Deployment
1. Copy your backend Railway URL
2. Update `NEXT_PUBLIC_API_URL` in frontend variables
3. Update `FRONTEND_URL` in backend variables

### After Frontend Deployment
1. Copy your frontend Railway URL
2. Update `FRONTEND_URL` in backend variables

## 🧪 Testing Commands

```bash
# Test backend health
curl https://your-backend-domain.railway.app/health

# Test admin access
curl -H "Admin-Key: 80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1" \
  https://your-backend-domain.railway.app/admin/groups

# Test MongoDB connection
curl https://your-backend-domain.railway.app/api/groups?admin_key=80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1
```

## ⚠️ Important Notes

1. **Replace MongoDB URI** with your actual MongoDB Atlas connection string
2. **Update URLs** after Railway deployment with your actual domain names
3. **Never commit** .env files to version control
4. **Keep admin API key** secure and rotate regularly
5. **Use HTTPS** for all production URLs

## 🔗 Useful Links

- [Contract Explorer](https://testnet.bscscan.com/address/0xe93ECeA7f56719e60cb03fc1608A5830793D95FF)
- [Railway Dashboard](https://railway.app/dashboard)
- [MongoDB Atlas](https://cloud.mongodb.com)
- [Complete Deployment Guide](COMPLETE_DEPLOYMENT_GUIDE.md)
