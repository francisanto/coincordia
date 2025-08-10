# Fix Railway Deployment - Root Directory Issue

## 🚨 **Problem: Can't Set Root Directory**

Railway is automatically deploying the entire project instead of just the backend folder. Here's how to fix it:

## ✅ **Solution 1: Cancel and Redeploy**

### **Step 1: Cancel Current Deployment**
1. **Click on the "concordia" service** that's currently building
2. **Click the "..." menu** (three dots)
3. **Select "Delete"** to remove the current service
4. **Confirm deletion**

### **Step 2: Create New Service with Root Directory**
1. **Click "+ Create"** again
2. **Select "GitHub Repo"**
3. **Choose**: `francisanto/concordia`
4. **Look for "Root Directory" field** - it should appear
5. **Set Root Directory**: `backend`
6. **Click "Deploy Now"**

## ✅ **Solution 2: Use Railway CLI**

If the web interface doesn't work:

### **Step 1: Install Railway CLI**
```bash
npm install -g @railway/cli
```

### **Step 2: Login to Railway**
```bash
railway login
```

### **Step 3: Create Backend Service**
```bash
railway service create --name concordia-backend
railway service connect
railway service set-directory backend
railway up
```

## ✅ **Solution 3: Manual Configuration**

### **Step 1: Create Service**
1. **Click "+ Create"**
2. **Select "GitHub Repo"**
3. **Choose**: `francisanto/concordia`
4. **Let it deploy** (even without root directory)

### **Step 2: Configure After Deployment**
1. **Click on the new service**
2. **Go to "Settings" tab**
3. **Look for "Root Directory" setting**
4. **Set it to**: `backend`
5. **Save and redeploy**

## ✅ **Solution 4: Use Different Repository Structure**

### **Option A: Create Backend-Only Repository**
1. **Create new GitHub repo**: `concordia-backend`
2. **Copy only backend files** to new repo
3. **Deploy from new repo**

### **Option B: Use Branch**
1. **Create `backend` branch** in your repo
2. **Move backend files** to root in that branch
3. **Deploy from `backend` branch**

## 🎯 **Recommended Approach**

**Try Solution 1 first:**
1. **Delete current service**
2. **Create new service**
3. **Set root directory to `backend`**

## 📋 **What to Look For**

When creating the service, you should see:
- **Repository selection**
- **Branch selection**
- **Root Directory field** ← This is what you need
- **Deploy button**

## 🚨 **If Root Directory Field is Missing**

Railway sometimes hides this field. Try:
1. **Different browser** (Chrome, Firefox, Safari)
2. **Incognito/Private mode**
3. **Clear browser cache**
4. **Use Railway CLI** instead

## 🎉 **After Successful Deployment**

You should have:
- **Two services** in your dashboard
- **Frontend service**: `concordia`
- **Backend service**: `concordia-backend`

**Try Solution 1 first - delete the current service and create a new one with the correct root directory!** 🚀 