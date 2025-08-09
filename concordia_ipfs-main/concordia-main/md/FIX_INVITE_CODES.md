# Fix Invite Codes - Let Friends Join Your Groups

## 🚨 **Current Problem**
Your friends get "Invalid group code" errors because:
1. ❌ No backend service to store group data
2. ❌ Invite codes only stored in localStorage (not shared)
3. ❌ Friends can't access your local data

## ✅ **Solution: Create Backend Service**

### **Step 1: Create Backend Service in Railway**

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Select your concordia project**
3. **Click "New Service"** → "GitHub Repo"
4. **Select repository**: `francisanto/concordia`
5. **Set Root Directory**: `backend`
6. **Set Start Command**: `npm start`
7. **Deploy**

### **Step 2: Set Backend Environment Variables**

Add these to your backend service:

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

### **Step 3: Update Frontend Environment Variables**

Add this to your frontend service:

```
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app/api
```

### **Step 4: Create a New Group**

1. **Go to your app**: https://concordia-production.up.railway.app
2. **Create a new group** - this will generate an invite code
3. **Copy the invite code** (6-character code like "ABC123")

### **Step 5: Share with Friends**

**Share this with your friends:**

1. **App URL**: https://concordia-production.up.railway.app
2. **Invite Code**: [Your generated code]
3. **Instructions**: 
   - Go to the app
   - Click "Join Group"
   - Enter the invite code
   - Add your nickname
   - Click "Join Group"

## 🎯 **How It Works Now**

✅ **Backend stores group data** in Greenfield storage  
✅ **Invite codes are generated** automatically  
✅ **Friends can join** using the codes  
✅ **Data persists** across all users  
✅ **Real-time updates** for all members  

## 🚀 **Alternative: Quick Fix**

If you want to test immediately:

1. **Create a group** in your app
2. **Check the browser console** for the invite code
3. **Share the code** with friends
4. **Friends use the same app URL** to join

## 📋 **What Friends Need**

- **Wallet**: MetaMask or similar
- **Test tokens**: opBNB testnet tokens
- **Invite code**: The 6-character code you generate
- **App URL**: https://concordia-production.up.railway.app

## 🎉 **Result**

After this setup:
- ✅ Friends can join your groups
- ✅ Invite codes work properly
- ✅ Everyone can save together
- ✅ Data is shared and persistent

**Your friends will be able to join and save with you!** 🎉 