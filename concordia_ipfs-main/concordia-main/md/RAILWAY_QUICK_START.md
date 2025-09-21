# Railway Quick Start Guide

## 🚀 Deploy in 5 Minutes

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```

### Step 3: Deploy Your Project
```bash
# Option A: Use the automated script
npm run deploy:railway

# Option B: Manual deployment
railway init
railway up
```

### Step 4: Set Environment Variables

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Go to "Variables" tab
4. Add the variables from `railway.env.template`

### Step 5: Get Your URLs

```bash
railway domain --service frontend
railway domain --service backend
```

## 🔧 Manual Setup (Alternative)

### 1. Create Railway Project
```bash
railway init
```

### 2. Deploy Services
```bash
# Deploy frontend
railway up --service frontend

# Deploy backend  
railway up --service backend
```

### 3. Configure Environment Variables
Copy variables from `railway.env.template` to Railway dashboard.

### 4. Update URLs
After deployment, update:
- `NEXT_PUBLIC_API_URL` with your backend URL
- `FRONTEND_URL` with your frontend URL

## 🎯 What's Included

✅ **Frontend**: Next.js application  
✅ **Backend**: Express.js server  
✅ **Health Checks**: Automatic monitoring  
✅ **Environment Management**: Secure variable storage  
✅ **Auto-scaling**: Built-in load balancing  
✅ **SSL/HTTPS**: Automatic certificate management  

## 🔍 Verify Deployment

1. **Frontend**: Visit your frontend URL
2. **Backend**: Visit `your-backend-url/api/health`
3. **Logs**: Check Railway dashboard for any errors

## 🆘 Need Help?

- Check the full guide: `RAILWAY_DEPLOYMENT_GUIDE.md`
- Railway Docs: https://docs.railway.app/
- Railway Discord: https://discord.gg/railway

---

**Ready to deploy? Run `npm run deploy:railway` and follow the prompts!** 