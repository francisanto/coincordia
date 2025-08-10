# 🚀 Railway Deployment Guide for Concordia

This guide will help you deploy both the frontend and backend of Concordia to Railway with MongoDB integration.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **MongoDB Atlas Account**: Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **GitHub Repository**: Your Concordia code should be in a GitHub repository

## 🗄️ MongoDB Atlas Setup

### 1. Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new project called "Concordia"
3. Create a new cluster (M0 Free tier is sufficient for development)
4. Choose your preferred cloud provider and region
5. Click "Create Cluster"

### 2. Configure Database Access

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a username and password (save these!)
4. Set privileges to "Read and write to any database"
5. Click "Add User"

### 3. Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 4. Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/concordia?retryWrites=true&w=majority`)
5. Replace `<password>` with your actual password

## 🚂 Railway Deployment

### 1. Deploy Backend First

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your Concordia repository
5. Set the root directory to `backend`
6. Click "Deploy"

### 2. Configure Backend Environment Variables

In your Railway project, go to "Variables" tab and add these environment variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/concordia?retryWrites=true&w=majority

# Server Configuration
PORT=3002
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.railway.app

# Admin Configuration
ADMIN_ADDRESS=0x0000000000000000000000000000000000000000
ADMIN_API_KEY=your-secure-admin-api-key-here

# Smart Contract Configuration
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# OpenAI Configuration (Optional)
OPENAI_API_KEY=your-openai-api-key
```

### 3. Deploy Frontend

1. Create a new Railway project
2. Choose "Deploy from GitHub repo"
3. Select your Concordia repository
4. Set the root directory to `.` (root)
5. Click "Deploy"

### 4. Configure Frontend Environment Variables

In your frontend Railway project, go to "Variables" tab and add:

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-backend-domain.railway.app

# Smart Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=5611
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org

# Admin Configuration
ADMIN_API_KEY=your-secure-admin-api-key-here
```

## 🔧 Backend Configuration

### 1. Update Backend Dependencies

Make sure your `backend/package.json` has these scripts:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### 2. Update Backend Server

Ensure your `backend/server.js` has proper CORS configuration:

```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://your-frontend-domain.railway.app",
    credentials: true,
  }),
)
```

## 🌐 Domain Configuration

### 1. Custom Domains (Optional)

1. In your Railway project, go to "Settings"
2. Click "Domains"
3. Add your custom domain
4. Update your DNS records as instructed

### 2. Update Environment Variables

After setting up domains, update your environment variables:

```env
# Backend
FRONTEND_URL=https://your-custom-domain.com

# Frontend
NEXT_PUBLIC_API_URL=https://api.your-custom-domain.com
```

## 🔍 Testing Your Deployment

### 1. Test Backend Health

```bash
curl https://your-backend-domain.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### 2. Test Frontend

1. Visit your frontend URL
2. Connect your wallet
3. Try creating a group
4. Check if data is saved to MongoDB

### 3. Test Admin Access

```bash
curl -H "Admin-Key: your-admin-api-key" \
  https://your-backend-domain.railway.app/admin/groups
```

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check that `FRONTEND_URL` is correctly set
   - Ensure the URL includes the protocol (https://)

2. **MongoDB Connection Issues**
   - Verify your MongoDB connection string
   - Check that your IP is whitelisted (or use 0.0.0.0/0)
   - Ensure your database user has proper permissions

3. **Environment Variables Not Loading**
   - Restart your Railway service after adding variables
   - Check variable names for typos
   - Ensure variables are in the correct project

4. **Build Failures**
   - Check Railway logs for specific error messages
   - Ensure all dependencies are in `package.json`
   - Verify Node.js version compatibility

### Logs and Monitoring

1. **View Logs**: Go to your Railway project → "Deployments" → Click on deployment → "Logs"
2. **Monitor Performance**: Use Railway's built-in monitoring
3. **Set up Alerts**: Configure alerts for downtime or errors

## 🔐 Security Considerations

### 1. Environment Variables

- Never commit sensitive data to your repository
- Use strong, unique passwords for MongoDB
- Rotate API keys regularly
- Use different keys for development and production

### 2. MongoDB Security

- Enable MongoDB Atlas security features
- Use VPC peering if possible
- Enable audit logging
- Set up backup schedules

### 3. API Security

- Implement rate limiting
- Add request validation
- Use HTTPS everywhere
- Consider adding API authentication

## 📊 Monitoring and Maintenance

### 1. Database Monitoring

- Monitor MongoDB Atlas metrics
- Set up alerts for high usage
- Regularly backup your data
- Monitor query performance

### 2. Application Monitoring

- Set up error tracking (Sentry, etc.)
- Monitor API response times
- Track user activity
- Set up uptime monitoring

### 3. Regular Maintenance

- Keep dependencies updated
- Monitor for security vulnerabilities
- Review and rotate API keys
- Backup data regularly

## 🚀 Production Checklist

- [ ] MongoDB Atlas cluster configured
- [ ] Database user created with proper permissions
- [ ] Network access configured
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Railway
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] Custom domains configured (if needed)
- [ ] Health checks passing
- [ ] Admin API working
- [ ] User registration/login working
- [ ] Group creation working
- [ ] Data persistence verified
- [ ] Error monitoring set up
- [ ] Backup strategy implemented

## 📞 Support

If you encounter issues:

1. Check Railway logs first
2. Verify all environment variables
3. Test MongoDB connection
4. Check CORS configuration
5. Review this guide for common issues

For additional help, check the Railway documentation or MongoDB Atlas support.
