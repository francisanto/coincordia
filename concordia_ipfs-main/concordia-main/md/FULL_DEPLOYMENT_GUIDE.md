# Full Deployment Guide - Frontend + Backend in Railway

## 🎯 **Goal: Both Services Fully Deployed and Working**

You need **two services** in Railway:
1. **Frontend Service**: `concordia` (Next.js app) ✅ Already deployed
2. **Backend Service**: `concordia-backend` (Express.js API) ❌ Needs to be created

## ✅ **Step 1: Create Backend Service**

### **Method A: Railway Dashboard (Recommended)**

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Select your project**: `sincere-youthfulness`
3. **Click "+ Create"** (top-right corner)
4. **Select "GitHub Repo"**
5. **Choose repository**: `francisanto/concordia`
6. **Set Root Directory**: `backend` ← **CRUCIAL!**
7. **Click "Deploy Now"**

### **Method B: If Root Directory Field is Missing**

1. **Let the service deploy** (even without root directory)
2. **Click on the new service** once deployed
3. **Go to "Settings" tab**
4. **Find "Root Directory" setting**
5. **Set it to**: `backend`
6. **Save and redeploy**

## ✅ **Step 2: Set Backend Environment Variables**

**In your new backend service, add these variables:**

```
PORT=3001
FRONTEND_URL=https://concordia-production.up.railway.app
NODE_ENV=production
CONTRACT_ADDRESS=0x58ae7520F81DC3464574960B792D43A82BF0C3f1
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
GREENFIELD_ENDPOINT=https://gnfd-testnet-sp1.bnbchain.org
GREENFIELD_CHAIN_ID=5600
GREENFIELD_BUCKET=concordia-data
GREENFIELD_ACCOUNT_ADDRESS=0xdA13e8F82C83d14E7aa639354054B7f914cA0998
GREENFIELD_PRIVATE_KEY=your_private_key_here
```

## ✅ **Step 3: Update Frontend Environment Variables**

**In your existing frontend service (`concordia`), add:**

```
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app/api
```

**Replace `your-backend-service` with the actual backend service URL.**

## ✅ **Step 4: Verify Both Services**

**You should see in Railway dashboard:**

```
📁 Project: sincere-youthfulness
├── 🟢 concordia (frontend) - https://concordia-production.up.railway.app
└── 🟢 concordia-backend (backend) - https://concordia-backend-production.up.railway.app
```

## ✅ **Step 5: Test the Full Deployment**

### **Test Backend API**
1. **Visit**: `https://concordia-backend-production.up.railway.app/api/health`
2. **Should see**: `{"status":"OK","timestamp":"...","services":{"greenfield":true,"blockchain":true}}`

### **Test Frontend**
1. **Visit**: `https://concordia-production.up.railway.app`
2. **Connect wallet**
3. **Your groups should appear!**

### **Test Cross-Browser Access**
1. **Create a group** in Chrome
2. **Open Firefox** and connect same wallet
3. **Your group should appear!**

## 🎯 **Expected Results**

After full deployment:
- ✅ **Frontend**: Shows your dashboard with groups
- ✅ **Backend**: API endpoints working
- ✅ **Cross-browser**: Same data in any browser
- ✅ **Friends**: Can join using invite codes
- ✅ **Data persistence**: No more lost data

## 🚨 **Common Issues & Fixes**

### **Issue 1: Backend Service Not Found**
- **Fix**: Make sure root directory is set to `backend`
- **Check**: Backend service should show `server.js` in logs

### **Issue 2: Frontend Can't Connect to Backend**
- **Fix**: Check `NEXT_PUBLIC_API_URL` environment variable
- **Verify**: Backend URL is correct and accessible

### **Issue 3: Environment Variables Missing**
- **Fix**: Add all required variables to both services
- **Check**: Railway logs for missing variable errors

### **Issue 4: CORS Errors**
- **Fix**: Backend CORS origin should match frontend URL
- **Check**: `FRONTEND_URL` environment variable in backend

## 🎉 **Success Indicators**

✅ **Both services deployed** and running  
✅ **Health check endpoint** returns OK  
✅ **Dashboard loads** with your groups  
✅ **Cross-browser access** works  
✅ **Invite codes** work for friends  

## 📋 **Final Checklist**

- [ ] Backend service created with root directory `backend`
- [ ] Backend environment variables set
- [ ] Frontend environment variables updated
- [ ] Both services deployed successfully
- [ ] Health check endpoint working
- [ ] Dashboard shows groups
- [ ] Cross-browser access working
- [ ] Friends can join with invite codes

**Follow these steps and you'll have a fully working frontend + backend deployment!** 🚀 