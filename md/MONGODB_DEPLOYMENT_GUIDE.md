# 🚀 MongoDB Deployment Guide for Concordia

This guide will help you deploy the Concordia application on Railway with MongoDB as the data storage solution.

## 📋 Prerequisites

1. A [Railway](https://railway.app/) account
2. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (free tier available)
3. Git installed on your local machine

## 🔧 Step 1: Set Up MongoDB Atlas

1. **Create a MongoDB Atlas account** if you don't have one already
2. **Create a new project** in MongoDB Atlas
3. **Build a new cluster**
   - Choose the FREE tier
   - Select a cloud provider and region close to your users
   - Click "Create Cluster"
4. **Set up database access**
   - Go to "Database Access" under Security
   - Add a new database user with password authentication
   - Give the user "Read and Write to Any Database" permissions
   - Save the username and password for later
5. **Configure network access**
   - Go to "Network Access" under Security
   - Add a new IP address
   - Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
   - For production, you can restrict to Railway's IP ranges
6. **Get your connection string**
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user's password
   - Replace `<dbname>` with "concordia"

## 🔧 Step 2: Deploy to Railway

1. **Login to Railway**
   - Run `railway login` in your terminal

2. **Initialize Railway project**
   - Navigate to your project directory
   - Run `railway init`
   - Create a new project when prompted

3. **Add MongoDB environment variable**
   - Run `railway variables set MONGODB_URI="your-mongodb-connection-string"`
   - Replace "your-mongodb-connection-string" with the connection string from MongoDB Atlas

4. **Add other required environment variables**
   ```
   railway variables set PORT=3000
   railway variables set ADMIN_ADDRESS="your-admin-wallet-address"
   railway variables set FRONTEND_URL="https://your-frontend-url.up.railway.app"
   ```

5. **Deploy the application**
   - Run `railway up`
   - This will deploy your application to Railway

6. **Generate a domain**
   - Run `railway domain`
   - Choose a domain for your application

## 🔧 Step 3: Verify Deployment

1. **Check deployment status**
   - Run `railway status`
   - Ensure your application is deployed successfully

2. **Test the API**
   - Visit `https://your-domain.up.railway.app/api/health`
   - You should see a response indicating the server is running

## 🔧 Step 4: Connect Frontend to Backend

1. **Update frontend environment variables**
   - Set `NEXT_PUBLIC_API_URL` to your Railway backend URL
   - Deploy the frontend to Railway or Vercel

## 🔍 Troubleshooting

### MongoDB Connection Issues

- **Error**: "MongoNetworkError: failed to connect to server"
  - **Solution**: Check your MongoDB connection string and network access settings

- **Error**: "MongoError: Authentication failed"
  - **Solution**: Verify your MongoDB username and password

### Railway Deployment Issues

- **Error**: "Build failed"
  - **Solution**: Check your build logs for specific errors

- **Error**: "Application crashed"
  - **Solution**: Check your application logs using `railway logs`

## 📝 Additional Notes

- For production deployments, consider setting up MongoDB Atlas backups
- Regularly monitor your MongoDB Atlas metrics for performance issues
- Consider adding indexes to your MongoDB collections for better performance

## 🔒 Security Considerations

- Never commit your MongoDB connection string to your repository
- Use environment variables for all sensitive information
- Restrict MongoDB network access to only necessary IP addresses
- Implement proper authentication and authorization in your application

---

🎉 Congratulations! Your Concordia application is now deployed on Railway with MongoDB as the data storage solution.