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

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params
    console.log('📥 GET /api/groups/:groupId - Fetching group from BNB Greenfield:', groupId)
    
    // Get user address from request headers or query parameters
    const url = new URL(request.url)
    const userAddress = url.searchParams.get('address')?.toLowerCase()
    const isAdmin = url.searchParams.get('admin_key') === process.env.ADMIN_API_KEY
    
    console.log('👤 Request from user:', userAddress, 'Admin access:', isAdmin)
    
    const client = await initGreenfield()
    const objectName = `groups/group_${groupId}.json`

    try {
      // Download object content
      const objectData = await client.object.downloadFile({
        bucketName: GREENFIELD_CONFIG.bucketName,
        objectName: objectName,
      })

      const metadata = JSON.parse(objectData.toString())
      console.log('✅ Group loaded successfully:', groupId)
      
      // Check if user has access to this group
      if (!isAdmin && userAddress) {
        const isCreator = metadata.creator?.toLowerCase() === userAddress
        const isMember = metadata.members?.some((member: any) => 
          member.address?.toLowerCase() === userAddress
        )
        
        if (!isCreator && !isMember) {
          console.log('🔒 Access denied for user:', userAddress, 'to group:', groupId)
          return NextResponse.json({
            error: `Access denied to group: ${groupId}`,
            details: 'You are not a member of this group',
          }, { status: 403 })
        }
        
        console.log('✅ Access granted for user:', userAddress, 'to group:', groupId)
      } else if (isAdmin) {
        console.log('👑 Admin access granted to group:', groupId)
      } else {
        // If no user address and not admin, deny access
        console.log('⚠️ No user address or admin key provided - access denied')
        return NextResponse.json({
          error: `Access denied to group: ${groupId}`,
          details: 'Authentication required',
        }, { status: 401 })
      }

      return NextResponse.json({
        success: true,
        metadata,
      })
    } catch (error) {
      console.error(`❌ Error fetching group ${groupId}:`, error instanceof Error ? error.message : error)
      return NextResponse.json({
        error: `Group not found: ${groupId}`,
        details: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 404 })
    }
  } catch (error) {
    console.error("❌ Error retrieving group from BNB Greenfield:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      error: "Failed to retrieve group from BNB Greenfield",
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}