import { NextResponse } from 'next/server'
import { Client } from '@bnb-chain/greenfield-js-sdk'

const GREENFIELD_CONFIG = {
  endpoint: process.env.GREENFIELD_ENDPOINT || "https://gnfd-testnet-sp1.bnbchain.org",
  chainId: process.env.GREENFIELD_CHAIN_ID || 5600,
  bucketName: process.env.GREENFIELD_BUCKET || "concordia-data",
  adminAddress: process.env.ADMIN_ADDRESS || "0x0000000000000000000000000000000000000000", // Admin wallet address
}

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
    console.log('👑 GET /api/admin/groups - Admin access to all groups')
    
    const url = new URL(request.url)
    
    // Check if this is an admin check request
    const isAdminCheck = url.searchParams.get('check_admin') === 'true'
    const checkAddress = url.searchParams.get('address')
    
    if (isAdminCheck && checkAddress) {
      console.log('🔍 Checking if address is admin:', checkAddress)
      const isAdmin = checkAddress.toLowerCase() === GREENFIELD_CONFIG.adminAddress.toLowerCase()
      
      if (isAdmin) {
        console.log('✅ Admin address verified')
        return NextResponse.json({
          isAdmin: true,
          adminApiKey: process.env.ADMIN_API_KEY
        })
      } else {
        console.log('❌ Not an admin address')
        return NextResponse.json({ isAdmin: false })
      }
    }
    
    // For regular admin data requests, verify admin API key
    const adminKey = url.searchParams.get('admin_key')
    
    if (adminKey !== process.env.ADMIN_API_KEY) {
      console.error('🔒 Unauthorized admin access attempt')
      return NextResponse.json({
        error: "Unauthorized. Admin API key required.",
      }, { status: 401 })
    }
    
    console.log('✅ Admin API key verified')
    const client = await initGreenfield()
    
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
        console.log('✅ Group loaded:', groupData.groupId || groupData.id)
      } catch (error) {
        console.error(`❌ Error fetching group ${object.objectName}:`, error instanceof Error ? error.message : error)
      }
    }

    console.log('✅ Successfully loaded all groups for admin:', groups.length)
    
    // Return all groups with admin statistics
    const stats = {
      totalGroups: groups.length,
      totalMembers: groups.reduce((acc, group) => acc + (group.members?.length || 0), 0),
      totalContributions: groups.reduce((acc, group) => acc + (group.currentAmount || 0), 0),
      activeGroups: groups.filter(group => group.isActive).length,
      inactiveGroups: groups.filter(group => !group.isActive).length,
    }
    
    return NextResponse.json({
      success: true,
      groups,
      stats,
    })
  } catch (error) {
    console.error("❌ Error retrieving groups from BNB Greenfield:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      error: "Failed to retrieve groups from BNB Greenfield",
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}