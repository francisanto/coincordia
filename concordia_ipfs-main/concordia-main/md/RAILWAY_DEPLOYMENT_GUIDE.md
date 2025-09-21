# Railway Deployment Guide for Concordia DApp

This guide will help you deploy your full-stack Concordia DApp (Next.js frontend + Express.js backend) to Railway.

## 🚀 Quick Start

### Prerequisites
- [Railway account](https://railway.app/)
- [GitHub account](https://github.com/)
- Your project code pushed to GitHub

## 📋 Project Structure Overview

Your project consists of:
- **Frontend**: Next.js application (root directory)
- **Backend**: Express.js server (`backend/` directory)
- **Smart Contracts**: Solidity contracts (`contracts/` directory)

## 🛠️ Step 1: Prepare Your Repository

### 1.1 Create Railway Configuration Files

Create the following files in your project root:

#### `railway.toml` (Root Directory)
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start:railway"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[[services]]
name = "frontend"
sourceDir = "."
buildCommand = "npm install && npm run build"
startCommand = "npm start"
port = 3000

[[services]]
name = "backend"
sourceDir = "backend"
buildCommand = "npm install"
startCommand = "npm start"
port = 3001
```

#### `railway.json` (Root Directory)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm run start:railway",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 3
  }
}
```

### 1.2 Update Package.json Scripts

Add these scripts to your root `package.json`:

```json
{
  "scripts": {
    "start:railway": "concurrently \"npm run start:frontend\" \"npm run start:backend\"",
    "start:frontend": "next start -p $PORT",
    "start:backend": "cd backend && npm start",
    "build:railway": "npm run build && cd backend && npm install",
    "postinstall": "cd backend && npm install"
  }
}
```

### 1.3 Create Backend Railway Configuration

Create `backend/railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

## 🔧 Step 2: Environment Configuration

### 2.1 Create Environment Files

#### Root `.env.local` (for frontend)
```bash
# Smart Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org

# Backend API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app
```

#### `backend/.env` (for backend)
```bash
# Server Configuration
PORT=3001
FRONTEND_URL=https://your-frontend-service.railway.app
NODE_ENV=production

# Smart Contract Configuration
CONTRACT_ADDRESS=your_contract_address
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org

# BNB Greenfield Configuration
GREENFIELD_ENDPOINT=https://gnfd-testnet-sp1.bnbchain.org
GREENFIELD_CHAIN_ID=5600
GREENFIELD_BUCKET=concordia-data
GREENFIELD_ACCOUNT_ADDRESS=your_greenfield_account_address
GREENFIELD_PRIVATE_KEY=your_greenfield_private_key
```

### 2.2 Add Health Check Endpoint

Add this to your `backend/server.js`:

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'concordia-backend'
  });
});
```

## 🚀 Step 3: Deploy to Railway

### 3.1 Connect Your Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect your project structure

### 3.2 Configure Services

Railway will create two services automatically:

#### Frontend Service
- **Name**: `frontend` (or your repo name)
- **Source Directory**: `/` (root)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Port**: `3000`

#### Backend Service
- **Name**: `backend`
- **Source Directory**: `/backend`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Port**: `3001`

### 3.3 Set Environment Variables

For each service, go to the "Variables" tab and add:

#### Frontend Variables
```
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app
```

#### Backend Variables
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

### 3.4 Deploy

1. Click "Deploy" in Railway
2. Monitor the build logs
3. Wait for deployment to complete

## 🔗 Step 4: Configure Domains

### 4.1 Custom Domains (Optional)

1. Go to your service settings
2. Click "Domains"
3. Add your custom domain
4. Configure DNS records as instructed

### 4.2 Update Environment Variables

After getting your Railway URLs, update the environment variables:

```
NEXT_PUBLIC_API_URL=https://your-backend-service.railway.app
FRONTEND_URL=https://your-frontend-service.railway.app
```

## 🔍 Step 5: Verify Deployment

### 5.1 Check Services

1. **Frontend**: Visit your frontend URL
2. **Backend**: Visit `https://your-backend-service.railway.app/health`

### 5.2 Monitor Logs

- Go to Railway Dashboard
- Click on each service
- Check "Logs" tab for any errors

## 🛠️ Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check if all dependencies are in package.json
npm install --production=false
```

#### Port Issues
- Ensure `PORT` environment variable is set
- Check that services use different ports

#### CORS Issues
- Verify `FRONTEND_URL` in backend environment
- Check CORS configuration in `server.js`

#### Environment Variables
- Ensure all required variables are set in Railway
- Check variable names match your code

### Debug Commands

```bash
# Check Railway logs
railway logs

# SSH into Railway container
railway shell

# Check environment variables
railway variables
```

## 📊 Monitoring and Maintenance

### 1. Set Up Monitoring
- Enable Railway's built-in monitoring
- Set up alerts for service failures
- Monitor resource usage

### 2. Auto-scaling
- Configure auto-scaling based on traffic
- Set resource limits appropriately

### 3. Backups
- Regular database backups (if applicable)
- Version control for configuration changes

## 🔐 Security Considerations

### 1. Environment Variables
- Never commit sensitive data to Git
- Use Railway's secure environment variable storage
- Rotate keys regularly

### 2. Network Security
- Use HTTPS in production
- Configure proper CORS settings
- Implement rate limiting

### 3. Smart Contract Security
- Use different keys for development/production
- Secure private key storage
- Regular security audits

## 📈 Scaling Considerations

### 1. Database
- Consider using Railway's PostgreSQL service
- Implement connection pooling
- Set up read replicas if needed

### 2. Caching
- Add Redis for session storage
- Implement API response caching
- Use CDN for static assets

### 3. Load Balancing
- Railway handles basic load balancing
- Consider multiple instances for high traffic

## 🎯 Next Steps

1. **Set up CI/CD**: Connect GitHub Actions for automated deployments
2. **Add monitoring**: Implement application performance monitoring
3. **Security audit**: Review and secure your deployment
4. **Performance optimization**: Optimize for production traffic
5. **Backup strategy**: Implement data backup and recovery

## 📞 Support

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

**Note**: This guide assumes you're deploying both frontend and backend as separate services on Railway. For a simpler setup, you could also deploy just the backend on Railway and the frontend on Vercel, then connect them via environment variables. 