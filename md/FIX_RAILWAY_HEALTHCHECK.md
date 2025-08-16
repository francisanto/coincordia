# Fix Railway Healthcheck Issue

## Problem
Your Railway backend deployment is failing with "1/1 replicas never became healthy!" error due to healthcheck configuration issues.

## Solution

### 1. Update Railway Configuration

The `railway.json` file has been updated with proper healthcheck settings:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### 2. Environment Variables Setup

**CRITICAL**: You must set these environment variables in your Railway project:

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to "Variables" tab
4. Add these variables:

```
PORT=3002
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/concordia?retryWrites=true&w=majority
CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
ADMIN_ADDRESS=0xdA13e8F82C83d14E7aa639354054B7f914cA0998
ADMIN_API_KEY=80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1
FRONTEND_URL=https://your-frontend-url.railway.app
```

### 3. MongoDB Setup

**REQUIRED**: You need a MongoDB database. You can:

1. Use MongoDB Atlas (free tier available)
2. Or use Railway's MongoDB plugin

**MongoDB Atlas Setup:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string
4. Replace `username:password@cluster.mongodb.net` with your actual credentials

### 4. Deploy Steps

1. **Commit and push your changes:**
```bash
git add .
git commit -m "Fix Railway healthcheck configuration"
git push origin main
```

2. **Redeploy on Railway:**
   - Go to your Railway project
   - Click "Deploy" or wait for automatic deployment
   - Monitor the deployment logs

3. **Check Health:**
   - Once deployed, visit: `https://your-backend-url.railway.app/health`
   - Should return a healthy status

### 5. Troubleshooting

**If healthcheck still fails:**

1. **Check Railway logs:**
   - Go to your service in Railway
   - Click "Deployments" tab
   - Check the latest deployment logs

2. **Common issues:**
   - Missing `MONGODB_URI` environment variable
   - Invalid MongoDB connection string
   - Port conflicts
   - Missing dependencies

3. **Manual health check:**
   ```bash
   curl https://your-backend-url.railway.app/health
   ```

### 6. Health Check Endpoints

The backend now has these health check endpoints:

- `GET /` - Basic status
- `GET /health` - Detailed health check with database status

### 7. Expected Health Response

When healthy, `/health` should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "server": "running",
  "environment": "production",
  "port": 3002,
  "envCheck": {
    "mongodb": true,
    "port": true,
    "contract": true,
    "rpc": true
  }
}
```

### 8. Next Steps

After fixing the healthcheck:

1. Test your API endpoints
2. Update your frontend to use the new backend URL
3. Set up your frontend deployment
4. Configure CORS if needed

## Important Notes

- **No Greenfield**: This setup uses only MongoDB, no Greenfield integration
- **MongoDB Required**: You must have a working MongoDB connection
- **Environment Variables**: All required variables must be set in Railway
- **Port 3002**: The backend runs on port 3002 by default

## Support

If you still have issues:
1. Check Railway deployment logs
2. Verify all environment variables are set
3. Test MongoDB connection separately
4. Check the `/health` endpoint manually
