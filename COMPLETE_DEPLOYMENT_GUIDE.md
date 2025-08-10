# 🚀 Complete Railway Deployment Guide for Concordia

## 📋 Prerequisites
- Railway account: [railway.app](https://railway.app)
- MongoDB Atlas account: [mongodb.com/atlas](https://mongodb.com/atlas)
- GitHub repository with your Concordia code

## 🗄️ Step 1: MongoDB Atlas Setup

### 1.1 Create MongoDB Atlas Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a new project called "Concordia"
3. Create a new cluster (M0 Free tier is sufficient)
4. Choose your preferred cloud provider and region
5. Click "Create Cluster"

### 1.2 Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a username and password (save these!)
4. Set privileges to "Read and write to any database"
5. Click "Add User"

### 1.3 Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.4 Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `concordia`

**Example connection string:**
```
mongodb+srv://concordia_user:your_password@cluster0.mongodb.net/concordia?retryWrites=true&w=majority
```

## 🚂 Step 2: Railway Backend Deployment

### 2.1 Create Railway Backend Project
1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your Concordia repository
5. Set the root directory to `backend`
6. Click "Deploy"

### 2.2 Configure Backend Environment Variables
In your Railway backend project, go to "Variables" tab and add:

```env
# Server Configuration
PORT=3002
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.railway.app

# Smart Contract Configuration
CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org

# MongoDB Configuration (Replace with your actual connection string)
MONGODB_URI=mongodb+srv://concordia_user:your_password@cluster0.mongodb.net/concordia?retryWrites=true&w=majority

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

### 2.3 Get Backend URL
After deployment, copy your backend Railway URL (e.g., `https://concordia-backend-production.up.railway.app`)

## 🌐 Step 3: Railway Frontend Deployment

### 3.1 Create Railway Frontend Project
1. Create a new Railway project
2. Choose "Deploy from GitHub repo"
3. Select your Concordia repository
4. Set the root directory to `.` (root)
5. Click "Deploy"

### 3.2 Configure Frontend Environment Variables
In your Railway frontend project, go to "Variables" tab and add:

```env
# Smart Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_CHAIN_ID=5611

# Backend API Configuration (Replace with your backend Railway URL)
NEXT_PUBLIC_API_URL=https://concordia-backend-production.up.railway.app

# Admin Configuration
ADMIN_API_KEY=80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1
```

### 3.3 Get Frontend URL
After deployment, copy your frontend Railway URL (e.g., `https://concordia-frontend-production.up.railway.app`)

## 🔄 Step 4: Update Environment Variables

### 4.1 Update Backend FRONTEND_URL
Go back to your backend Railway project and update:
```env
FRONTEND_URL=https://concordia-frontend-production.up.railway.app
```

### 4.2 Update Frontend NEXT_PUBLIC_API_URL
Go back to your frontend Railway project and update:
```env
NEXT_PUBLIC_API_URL=https://concordia-backend-production.up.railway.app
```

## 🧪 Step 5: Testing Your Deployment

### 5.1 Test Backend Health
```bash
curl https://concordia-backend-production.up.railway.app/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### 5.2 Test Frontend
1. Visit your frontend URL
2. Connect your wallet (MetaMask with opBNB Testnet)
3. Try creating a group
4. Check if data is saved to MongoDB

### 5.3 Test Admin Access
```bash
curl -H "Admin-Key: 80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1" \
  https://concordia-backend-production.up.railway.app/admin/groups
```

## 📊 Step 6: MongoDB Dashboard Access

### 6.1 Access MongoDB Atlas Dashboard
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Select your Concordia project
3. Click "Browse Collections" in your cluster
4. You should see the `concordia` database with collections:
   - `groups` - All created groups
   - `users` - User information
   - `invites` - Group invitations
   - `aurarewards` - Aura points and rewards

### 6.2 View Data in Dashboard
1. Click on any collection to view the data
2. You can see all groups created by users
3. Each group document contains:
   - Group details (name, description, goal amount)
   - Member information
   - Contributions and aura points
   - Creation and update timestamps

### 6.3 Monitor Database Activity
1. Go to "Metrics" tab in your cluster
2. Monitor:
   - Operations per second
   - Connection count
   - Data size
   - Query performance

## 🔧 Step 7: Environment Files for Local Development

### 7.1 Frontend (.env.local)
Create `.env.local` in the root directory:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
NEXT_PUBLIC_NETWORK=opBNB Testnet
NEXT_PUBLIC_RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
NEXT_PUBLIC_CHAIN_ID=5611
NEXT_PUBLIC_API_URL=https://concordia-backend-production.up.railway.app
```

### 7.2 Backend (.env)
Create `.env` in the backend directory:
```env
PORT=3002
FRONTEND_URL=https://concordia-frontend-production.up.railway.app
NODE_ENV=development
CONTRACT_ADDRESS=0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
MONGODB_URI=mongodb+srv://concordia_user:your_password@cluster0.mongodb.net/concordia?retryWrites=true&w=majority
ADMIN_ADDRESS=0xdA13e8F82C83d14E7aa639354054B7f914cA0998
ADMIN_API_KEY=80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1
```

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check that `FRONTEND_URL` in backend matches your frontend Railway URL exactly
   - Ensure URLs include `https://` protocol

2. **MongoDB Connection Issues**
   - Verify your connection string is correct
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

### Useful Commands

```bash
# Test backend health
curl https://your-backend-domain.railway.app/health

# Test admin access
curl -H "Admin-Key: 80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1" \
  https://your-backend-domain.railway.app/admin/groups

# Test MongoDB connection
curl https://your-backend-domain.railway.app/api/groups?admin_key=80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1
```

## 🔐 Security Considerations

1. **Environment Variables**
   - Never commit .env files to version control
   - Use strong, unique passwords for MongoDB
   - Rotate API keys regularly
   - Use different keys for development and production

2. **MongoDB Security**
   - Enable MongoDB Atlas security features
   - Use VPC peering if possible
   - Enable audit logging
   - Set up backup schedules

3. **API Security**
   - Implement rate limiting
   - Add request validation
   - Use HTTPS everywhere
   - Consider adding API authentication

## 📊 Monitoring and Maintenance

### Database Monitoring
- Monitor MongoDB Atlas metrics
- Set up alerts for high usage
- Regularly backup your data
- Monitor query performance

### Application Monitoring
- Set up error tracking (Sentry, etc.)
- Monitor API response times
- Track user activity
- Set up uptime monitoring

### Regular Maintenance
- Keep dependencies updated
- Monitor for security vulnerabilities
- Review and rotate API keys
- Backup data regularly

## 🎯 Production Checklist

- [ ] MongoDB Atlas cluster configured
- [ ] Database user created with proper permissions
- [ ] Network access configured
- [ ] Backend deployed to Railway
- [ ] Frontend deployed to Railway
- [ ] All environment variables set
- [ ] CORS configured correctly
- [ ] Health checks passing
- [ ] Admin API working
- [ ] User registration/login working
- [ ] Group creation working
- [ ] Data persistence verified
- [ ] MongoDB dashboard accessible
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

---

**Your Concordia application is now deployed and ready to use! 🎉**

**Frontend URL**: https://your-frontend-domain.railway.app
**Backend URL**: https://your-backend-domain.railway.app
**Contract Address**: 0xe93ECeA7f56719e60cb03fc1608A5830793D95FF
**MongoDB Dashboard**: Access via MongoDB Atlas
