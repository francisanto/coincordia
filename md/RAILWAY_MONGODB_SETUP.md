# 🚀 Railway + MongoDB Setup Instructions

## 🎯 Quick Setup (5 minutes)

### Step 1: MongoDB Atlas Setup

1. **Go to MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
2. **Sign up** for free account
3. **Create new project:** "Concordia"
4. **Create cluster:** Choose M0 (FREE)
5. **Create database user:**
   - Username: `concordia_user`
   - Password: Generate secure password (save it!)
   - Permissions: "Read and write to any database"
6. **Network access:** Allow access from anywhere (0.0.0.0/0)
7. **Get connection string:** 
   - Click "Connect" → "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your password
   - Replace `<dbname>` with `concordia`

### Step 2: Railway Environment Variables

**In your Railway backend service, add these variables:**

```
MONGODB_URI=mongodb+srv://concordia_user:YOUR_PASSWORD@concordia.abc123.mongodb.net/concordia?retryWrites=true&w=majority
PORT=3002
NODE_ENV=production
CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
ADMIN_ADDRESS=0xdA13e8F82C83d14E7aa639354054B7f914cA0998
ADMIN_API_KEY=80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1
FRONTEND_URL=https://your-frontend-domain.railway.app
```

**Replace:**
- `YOUR_PASSWORD` with your MongoDB password
- `concordia.abc123.mongodb.net` with your actual cluster URL
- `your-frontend-domain.railway.app` with your frontend URL

### Step 3: Deploy

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "Fix Railway deployment with MongoDB"
   git push origin main
   ```

2. **Redeploy in Railway:**
   - Go to Railway dashboard
   - Click "Deploy" or wait for auto-deploy
   - Monitor logs for success

3. **Test health check:**
   - Visit: `https://your-backend-url.railway.app/health`
   - Should return: `{"status":"healthy","database":"connected"}`

## 🎯 What This Fixes

✅ **Railway build errors** - Fixed npm ci issues  
✅ **MongoDB connection** - Proper database setup  
✅ **Environment variables** - All required vars configured  
✅ **Health checks** - Proper monitoring  
✅ **Data persistence** - Groups saved to MongoDB  

## 🧪 Test Your Setup

1. **Backend health:** `curl https://your-backend-url.railway.app/health`
2. **Create group:** Use your frontend to create a test group
3. **Check MongoDB:** Go to Atlas → Browse Collections → See your data
4. **Admin access:** Test admin endpoints with your API key

## 🚨 Common Issues

### "Database connection failed"
- Check MongoDB connection string is correct
- Verify username/password
- Ensure network access allows 0.0.0.0/0

### "Build still failing"
- Check Railway logs for specific errors
- Verify all files are committed to git
- Try manual redeploy

### "Environment variables not working"
- Restart Railway service after adding variables
- Check variable names match exactly
- Verify no extra spaces in values

## 🎉 Success Indicators

- ✅ Railway deployment succeeds
- ✅ Health check returns "healthy"
- ✅ MongoDB shows "connected"
- ✅ Groups can be created and saved
- ✅ Data persists in MongoDB Atlas

Your Concordia app will be fully functional with MongoDB storage! 🚀