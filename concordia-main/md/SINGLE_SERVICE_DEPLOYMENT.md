# Single Service Deployment - Frontend + Backend Together

## 🎯 **Goal: One Service Running Both Frontend and Backend**

Instead of two separate services, we'll create **one service** that runs both your Next.js frontend and Express.js backend together.

## ✅ **Step 1: Update Package.json for Single Service**

### **Modify Root package.json**

Add these scripts to your main `package.json`:

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "build": "npm run build:frontend",
    "start": "concurrently \"npm run start:frontend\" \"npm run start:backend\"",
    "dev:frontend": "next dev",
    "dev:backend": "cd backend && npm run dev",
    "start:frontend": "next start -p $PORT",
    "start:backend": "cd backend && npm start",
    "build:frontend": "next build",
    "install:all": "npm install && cd backend && npm install"
  },
  "dependencies": {
    "concurrently": "^8.2.2"
  }
}
```

## ✅ **Step 2: Create Railway Configuration**

### **Create railway.toml in Root**

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/api/health"
healthcheckTimeout = 300
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### **Create .nixpacks.toml in Root**

```toml
[phases.setup]
nixPkgs = ["nodejs_18"]

[phases.install]
cmds = ["npm run install:all"]

[phases.build]
cmds = ["npm run build"]

[start]
cmd = "npm run start"
```

## ✅ **Step 3: Update Backend Configuration**

### **Modify backend/server.js**

Change the port configuration:

```javascript
const PORT = process.env.BACKEND_PORT || 3001
const FRONTEND_PORT = process.env.PORT || 3000

// Start backend server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`)
})

// Also start frontend if needed
if (process.env.START_FRONTEND === 'true') {
  const { spawn } = require('child_process')
  const frontend = spawn('npm', ['run', 'start:frontend'], {
    stdio: 'inherit',
    shell: true
  })
}
```

## ✅ **Step 4: Create Single Service in Railway**

### **Method A: Delete Current Services and Create New**

1. **Delete both current services** (`concordia` and `sublime-curiosity`)
2. **Click "+ Create"**
3. **Select "GitHub Repo"**
4. **Choose**: `francisanto/concordia`
5. **Leave Root Directory empty** (use root folder)
6. **Click "Deploy Now"**

### **Method B: Use Current Service**

1. **Go to "sublime-curiosity" service**
2. **Settings tab**
3. **Set Root Directory to empty** (remove "backend")
4. **Save and redeploy**

## ✅ **Step 5: Set Environment Variables**

**Add these to your single service:**

```
PORT=3000
BACKEND_PORT=3001
NODE_ENV=production
START_FRONTEND=true
NEXT_PUBLIC_API_URL=http://localhost:3001/api
CONTRACT_ADDRESS=0x58ae7520F81DC3464574960B792D43A82BF0C3f1
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
GREENFIELD_ENDPOINT=https://gnfd-testnet-sp1.bnbchain.org
GREENFIELD_CHAIN_ID=5600
GREENFIELD_BUCKET=concordia-data
GREENFIELD_ACCOUNT_ADDRESS=0xdA13e8F82C83d14E7aa639354054B7f914cA0998
GREENFIELD_PRIVATE_KEY=your_private_key_here
```

## ✅ **Step 6: Update Frontend API Configuration**

### **Modify lib/api.ts**

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"
```

### **Modify backend/server.js CORS**

```javascript
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  }),
)
```

## 🎯 **Expected Result**

After deployment:
- ✅ **One service** running both frontend and backend
- ✅ **Frontend**: Available at your Railway URL
- ✅ **Backend API**: Available at `/api/*` endpoints
- ✅ **Health check**: `/api/health` endpoint
- ✅ **Cross-browser access**: Works from any browser

## 🚨 **Alternative: Simple Proxy Setup**

If the above is complex, we can also:
1. **Keep frontend service** as is
2. **Add API routes** to Next.js (in `app/api/` folder)
3. **Run backend logic** in Next.js API routes
4. **Single service** with Next.js handling both

## 🎉 **Benefits of Single Service**

- ✅ **Simpler deployment** - one service to manage
- ✅ **Shared environment** - same variables for both
- ✅ **Easier debugging** - all logs in one place
- ✅ **Cost effective** - one service instead of two

**Would you like me to implement the single service approach?** 🚀 