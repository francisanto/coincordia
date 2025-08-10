# Simple Single Service - Next.js API Routes

## 🎯 **Easiest Solution: Use Next.js API Routes**

Instead of separate frontend/backend, we'll use **Next.js API routes** to handle backend functionality in the same service.

## ✅ **Step 1: Create API Routes in Next.js**

### **Create app/api/health/route.ts**

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      greenfield: true,
      blockchain: true,
    },
  })
}
```

### **Create app/api/groups/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { Client } from '@bnb-chain/greenfield-js-sdk'

const GREENFIELD_CONFIG = {
  endpoint: process.env.GREENFIELD_ENDPOINT || "https://gnfd-testnet-sp1.bnbchain.org",
  chainId: process.env.GREENFIELD_CHAIN_ID || 5600,
  bucketName: process.env.GREENFIELD_BUCKET || "concordia-data",
}

let greenfieldClient: any = null

async function initGreenfield() {
  if (!greenfieldClient) {
    greenfieldClient = Client.create(GREENFIELD_CONFIG.endpoint, String(GREENFIELD_CONFIG.chainId))
  }
  return greenfieldClient
}

export async function GET() {
  try {
    const client = await initGreenfield()
    
    // List all objects in the groups folder
    const listObjectsResponse = await client.object.listObjects({
      bucketName: GREENFIELD_CONFIG.bucketName,
      prefix: "groups/",
      maxKeys: 1000,
    })

    if (!listObjectsResponse.objects || listObjectsResponse.objects.length === 0) {
      return NextResponse.json({
        success: true,
        groups: []
      })
    }

    // Fetch all group data
    const groups = []
    for (const object of listObjectsResponse.objects) {
      try {
        const objectData = await client.object.downloadFile({
          bucketName: GREENFIELD_CONFIG.bucketName,
          objectName: object.objectName,
        })
        const groupData = JSON.parse(objectData.toString())
        groups.push(groupData)
      } catch (error) {
        console.error(`Error fetching group ${object.objectName}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      groups,
    })
  } catch (error) {
    console.error("Error retrieving groups:", error)
    return NextResponse.json({
      error: "Failed to retrieve groups",
      details: error.message,
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { groupId, groupData } = await request.json()
    
    if (!groupId || !groupData) {
      return NextResponse.json({ error: "Group ID and data are required" }, { status: 400 })
    }

    const client = await initGreenfield()
    const objectName = `groups/group_${groupId}.json`
    
    // Generate invite code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let inviteCode = ''
    for (let i = 0; i < 6; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const metadata = {
      groupId,
      ...groupData,
      inviteCode,
      createdAt: new Date().toISOString(),
      version: "1.0",
    }

    // Store in Greenfield
    const createObjectTx = await client.object.createObject({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
      creator: process.env.GREENFIELD_ACCOUNT_ADDRESS,
      visibility: "VISIBILITY_TYPE_PUBLIC_READ",
      contentType: "application/json",
      redundancyType: "REDUNDANCY_EC_TYPE",
      payload: Buffer.from(JSON.stringify(metadata)),
    })

    return NextResponse.json({
      success: true,
      objectName,
      transactionHash: createObjectTx.transactionHash,
      metadata,
    })
  } catch (error) {
    console.error("Error storing group data:", error)
    return NextResponse.json({
      error: "Failed to store group data",
      details: error.message,
    }, { status: 500 })
  }
}
```

### **Create app/api/groups/[groupId]/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { Client } from '@bnb-chain/greenfield-js-sdk'

const GREENFIELD_CONFIG = {
  endpoint: process.env.GREENFIELD_ENDPOINT || "https://gnfd-testnet-sp1.bnbchain.org",
  chainId: process.env.GREENFIELD_CHAIN_ID || 5600,
  bucketName: process.env.GREENFIELD_BUCKET || "concordia-data",
}

let greenfieldClient: any = null

async function initGreenfield() {
  if (!greenfieldClient) {
    greenfieldClient = Client.create(GREENFIELD_CONFIG.endpoint, String(GREENFIELD_CONFIG.chainId))
  }
  return greenfieldClient
}

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params
    const client = await initGreenfield()
    const objectName = `groups/group_${groupId}.json`

    // Get object from Greenfield
    const objectInfo = await client.object.headObject(GREENFIELD_CONFIG.bucketName, objectName)

    if (!objectInfo) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Download object content
    const objectData = await client.object.downloadFile({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
    })

    const metadata = JSON.parse(objectData.toString())

    return NextResponse.json({
      success: true,
      groupId,
      metadata,
      objectInfo,
    })
  } catch (error) {
    console.error("Error retrieving group:", error)
    return NextResponse.json({
      error: "Failed to retrieve group",
      details: error.message,
    }, { status: 500 })
  }
}
```

## ✅ **Step 2: Update Frontend Configuration**

### **Modify lib/api.ts**

```typescript
const API_BASE_URL = "/api" // Use relative URLs for same service
```

### **Modify lib/hybrid-storage.ts**

```typescript
// Update API calls to use relative URLs
const apiUrl = "/api"
```

## ✅ **Step 3: Update Package.json**

### **Add Dependencies**

```json
{
  "dependencies": {
    "@bnb-chain/greenfield-js-sdk": "^2.0.0",
    "ethers": "^6.8.0"
  }
}
```

## ✅ **Step 4: Set Environment Variables**

**In your Railway service, add:**

```
NODE_ENV=production
CONTRACT_ADDRESS=0x58ae7520F81DC3464574960B792D43A82BF0C3f1
RPC_URL=https://opbnb-testnet-rpc.bnbchain.org
GREENFIELD_ENDPOINT=https://gnfd-testnet-sp1.bnbchain.org
GREENFIELD_CHAIN_ID=5600
GREENFIELD_BUCKET=concordia-data
GREENFIELD_ACCOUNT_ADDRESS=0xdA13e8F82C83d14E7aa639354054B7f914cA0998
GREENFIELD_PRIVATE_KEY=your_private_key_here
```

## ✅ **Step 5: Deploy Single Service**

1. **Use your current "concordia" service**
2. **Set Root Directory to empty** (use root folder)
3. **Deploy**

## 🎯 **Benefits**

- ✅ **One service** - frontend + backend together
- ✅ **No CORS issues** - same origin
- ✅ **Simpler deployment** - one service to manage
- ✅ **Next.js handles everything** - built-in API routes
- ✅ **Same functionality** - all backend features work

## 🎉 **Result**

After deployment:
- ✅ **Frontend**: Your app at Railway URL
- ✅ **Backend API**: `/api/health`, `/api/groups`, etc.
- ✅ **Cross-browser**: Works from any browser
- ✅ **Data persistence**: Groups stored in Greenfield

**This is the simplest solution - one service running everything!** 🚀 