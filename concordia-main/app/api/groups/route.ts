import { NextResponse } from 'next/server'
import { Client } from '@bnb-chain/greenfield-js-sdk'

const GREENFIELD_CONFIG = {
  endpoint: process.env.GREENFIELD_ENDPOINT || "https://gnfd-testnet-sp1.bnbchain.org",
  chainId: process.env.GREENFIELD_CHAIN_ID || 5600,
  bucketName: process.env.GREENFIELD_BUCKET || "concordia-data",
}

const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

let greenfieldClient: any = null

async function initGreenfield() {
  if (!greenfieldClient) {
    try {
      greenfieldClient = Client.create(GREENFIELD_CONFIG.endpoint, String(GREENFIELD_CONFIG.chainId))
      console.log('✅ Greenfield client initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Greenfield client:', error)
      throw error
    }
  }
  return greenfieldClient
}

export async function GET(request: Request) {
  try {
    console.log('📥 GET /api/groups - Fetching groups from BNB Greenfield')
    
    const client = await initGreenfield()
    
    // Get user address from request headers or query parameters
    const url = new URL(request.url)
    const userAddress = url.searchParams.get('address')?.toLowerCase()
    const isAdmin = userAddress === ADMIN_WALLET.toLowerCase()
    
    console.log('👤 Request from user:', userAddress, 'Admin access:', isAdmin)
    
    // List all objects in the groups folder
    const listObjectsResponse = await client.object.listObjects({
      bucketName: GREENFIELD_CONFIG.bucketName,
      prefix: "groups/",
      maxKeys: 1000,
    })

    console.log('📊 Found objects in Greenfield:', listObjectsResponse.objects?.length || 0)

    if (!listObjectsResponse.objects || listObjectsResponse.objects.length === 0) {
      console.log('📭 No groups found in Greenfield')
      return NextResponse.json({
        success: true,
        groups: []
      })
    }

    // Fetch all group data
    const groups = []
    for (const object of listObjectsResponse.objects) {
      try {
        console.log('📥 Fetching group:', object.objectName)
        const objectData = await client.object.downloadFile({
          bucketName: GREENFIELD_CONFIG.bucketName,
          objectName: object.objectName,
        })
        const groupData = JSON.parse(objectData.toString())
        groups.push(groupData)
        console.log('✅ Group loaded:', groupData.groupId)
      } catch (error) {
        console.error(`❌ Error fetching group ${object.objectName}:`, error instanceof Error ? error.message : error)
      }
    }

    console.log('✅ Successfully loaded groups from BNB Greenfield:', groups.length)
    
    // Filter groups based on user access
    let accessibleGroups = groups
    
    if (!isAdmin && userAddress) {
      // Regular users can only see groups they are part of
      accessibleGroups = groups.filter((group: any) => {
        const isCreator = group.creator?.toLowerCase() === userAddress
        const isMember = group.members?.some((member: any) => 
          member.address?.toLowerCase() === userAddress
        )
        return isCreator || isMember
      })
      console.log('🔒 Filtered groups for user access:', accessibleGroups.length)
      
      // Store user data in database for admin tracking
      if (accessibleGroups.length > 0) {
        try {
          const userStats = accessibleGroups.reduce((acc, group) => ({
            totalContributed: acc.totalContributed + (group.currentAmount || 0),
            totalAura: acc.totalAura + (group.members?.find((m: any) => m.address?.toLowerCase() === userAddress)?.auraPoints || 0)
          }), { totalContributed: 0, totalAura: 0 })
          
          // This would be stored in admin database but not exposed to regular users
          console.log('📊 User stats calculated for admin:', userStats)
        } catch (error) {
          console.log('⚠️ Error calculating user stats:', error)
        }
      }
    } else if (isAdmin) {
      console.log('👑 Admin access granted - returning all groups')
    } else {
      // If no user address and not admin, return empty array
      console.log('⚠️ No user address or admin key provided - returning empty array')
      accessibleGroups = []
    }
    
    return NextResponse.json({
      success: true,
      groups: accessibleGroups,
    })
  } catch (error) {
    console.error("❌ Error retrieving groups from BNB Greenfield:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      error: "Failed to retrieve groups from BNB Greenfield",
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { groupId, groupData } = await request.json()
    
    if (!groupId || !groupData) {
      return NextResponse.json({ error: "Group ID and data are required" }, { status: 400 })
    }

    console.log('📤 POST /api/groups - Storing group in BNB Greenfield:', groupId)
    
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

    console.log('💾 Storing group data in BNB Greenfield...')

    // Store in BNB Greenfield
    const createObjectTx = await client.object.createObject({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
      creator: process.env.GREENFIELD_ACCOUNT_ADDRESS || "0x0000000000000000000000000000000000000000",
      visibility: "VISIBILITY_TYPE_PUBLIC_READ",
      contentType: "application/json",
      redundancyType: "REDUNDANCY_EC_TYPE",
      payload: Buffer.from(JSON.stringify(metadata)),
    })

    console.log('✅ Group stored successfully in BNB Greenfield:', groupId)
    console.log('🔗 Transaction hash:', createObjectTx.transactionHash)

    return NextResponse.json({
      success: true,
      objectName,
      transactionHash: createObjectTx.transactionHash,
      metadata,
    })
  } catch (error) {
    console.error("❌ Error storing group data in BNB Greenfield:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      error: "Failed to store group data in BNB Greenfield",
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}