# Production Setup Guide - Fully Functional Concordia DApp

## Overview
This guide will help you set up your Concordia DApp for production with:
- **Admin data** stored in database
- **User data** stored in BNB Greenfield
- **Full functionality** for users

## 1. Database Setup (for Admin Data)

### Option A: Railway PostgreSQL (Recommended)
1. Go to Railway dashboard
2. Create a new PostgreSQL service
3. Get the connection string
4. Add to environment variables

### Option B: Supabase (Free tier available)
1. Go to supabase.com
2. Create new project
3. Get connection details

## 2. Environment Variables for Production

### Database Variables
```
DATABASE_URL=your_database_connection_string
```

### BNB Greenfield Variables
```
GREENFIELD_ENDPOINT=https://gnfd-testnet-sp1.bnbchain.org
GREENFIELD_CHAIN_ID=5600
GREENFIELD_BUCKET=0x000000000000000000000000000000000000000000000000000000000000566f
GREENFIELD_ACCOUNT_ADDRESS=0xdA13e8F82C83d14E7aa639354054B7f914cA0998
```

### Contract Variables
```
NEXT_PUBLIC_CONTRACT_ADDRESS=0x58ae7520F81DC3464574960B792D43A82BF0C3f1
```

### App Variables
```
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
NODE_ENV=production
```

## 3. Database Schema (Admin Data)

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) UNIQUE NOT NULL,
  nickname VARCHAR(100),
  total_aura_points INTEGER DEFAULT 0,
  total_contributed DECIMAL(18,8) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Admin_Logs Table
```sql
CREATE TABLE admin_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  admin_address VARCHAR(42),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### System_Stats Table
```sql
CREATE TABLE system_stats (
  id SERIAL PRIMARY KEY,
  total_groups INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  total_volume DECIMAL(18,8) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 4. API Routes Structure

### Admin Routes (Database)
- `/api/admin/users` - Get all users
- `/api/admin/stats` - Get system statistics
- `/api/admin/logs` - Get admin logs

### User Routes (Greenfield)
- `/api/groups` - User groups
- `/api/groups/store` - Store group data
- `/api/contributions` - User contributions

## 5. Implementation Steps

1. **Set up database**
2. **Create admin API routes**
3. **Update user API routes**
4. **Add authentication**
5. **Test all functionality**
6. **Deploy to production**

## 6. Testing Checklist

- [ ] Admin can view all users
- [ ] Admin can view system stats
- [ ] Users can create groups
- [ ] Users can join groups
- [ ] Users can contribute
- [ ] Data persists in Greenfield
- [ ] Admin data in database
- [ ] All transactions work

## 7. Production Deployment

1. Set all environment variables
2. Deploy to Railway
3. Test all features
4. Monitor logs
5. Launch for users

Would you like me to implement any specific part of this setup? 