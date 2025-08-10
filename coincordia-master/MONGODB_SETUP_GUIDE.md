# 🗄️ MongoDB Setup Guide for Railway

## 🚨 Current Issue
Your Railway deployment is failing because of npm ci issues and missing MongoDB URI.

## ✅ Step 1: Set Up MongoDB Atlas (Free)

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new project called "Concordia"

### 1.2 Create a Cluster
1. Click "Build a Database"
2. Choose "M0 Sandbox" (FREE)
3. Select a cloud provider and region
4. Name your cluster "Concordia"
5. Click "Create"

### 1.3 Create Database User
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `concordia_user`
5. Password: Generate a secure password (save this!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### 1.4 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.5 Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `concordia`

**Example connection string:**
```
mongodb+srv://concordia_user:your_password@concordia.abc123.mongodb.net/concordia?retryWrites=true&w=majority
```

## ✅ Step 2: Update Railway Environment Variables

In your Railway backend service, set these environment variables:

```
# MongoDB Configuration (REQUIRED)
MONGODB_URI=mongodb+srv://concordia_user:your_password@concordia.abc123.mongodb.net/concordia?retryWrites=true&w=majority

# Server Configuration
PORT=3002
NODE_ENV=production

# Smart Contract Configuration
CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org

# Admin Configuration
ADMIN_ADDRESS=0xdA13e8F82C83d14E7aa639354054B7f914cA0998
ADMIN_API_KEY=80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.railway.app
```

## ✅ Step 3: Fix Railway Build Issues

The build is failing because of npm ci. I've updated the configuration to:
1. Use `npm install` instead of `npm ci`
2. Add `--legacy-peer-deps` flag to handle dependency conflicts
3. Skip package-lock.json issues
4. Use proper nixpacks configuration

## ✅ Step 4: Deploy to Railway

1. **Commit the changes:**
   ```bash
   git add .
   git commit -m "Fix Railway deployment and add MongoDB setup"
   git push origin main
   ```

2. **Redeploy in Railway:**
   - Go to your Railway project
   - Click "Deploy" or wait for automatic deployment
   - Monitor the deployment logs

3. **Test the deployment:**
   - Visit: `https://your-backend-url.railway.app/health`
   - Should return: `{"status":"healthy","database":"connected"}`

## ✅ Step 5: Update Frontend Environment

In your Railway frontend service, update:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

## 🧪 Step 6: Test Everything

1. **Backend Health Check:**
   ```bash
   curl https://your-backend-url.railway.app/health
   ```

2. **Create a Test Group:**
   - Visit your frontend URL
   - Connect wallet
   - Create a group
   - Verify it saves to MongoDB

3. **Check MongoDB:**
   - Go to MongoDB Atlas dashboard
   - Click "Browse Collections"
   - You should see the `concordia` database with `groups` collection

## 🚨 Troubleshooting

### If deployment still fails:
1. **Check Railway logs** for specific errors
2. **Verify all environment variables** are set correctly
3. **Test MongoDB connection** separately
4. **Check the health endpoint** after deployment

### If MongoDB connection fails:
1. **Verify connection string** is correct
2. **Check username/password** are correct
3. **Ensure IP whitelist** includes 0.0.0.0/0
4. **Test connection** from MongoDB Atlas dashboard

## 🎯 Expected Result

After following this guide:
- ✅ Railway deployment succeeds
- ✅ Backend connects to MongoDB
- ✅ Health check returns "healthy"
- ✅ Groups are saved to MongoDB
- ✅ Frontend can access backend API
- ✅ No more deployment errors

## 📞 Need Help?

If you still have issues:
1. Check Railway deployment logs
2. Verify MongoDB Atlas setup
3. Test the health endpoint
4. Check environment variables

Your Concordia app will be fully functional with MongoDB storage! 🚀