import { NextResponse } from 'next/server'

const ADMIN_WALLET = process.env.ADMIN_ADDRESS || '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

export async function GET(request: Request) {
  try {
    console.log('📥 GET /api/groups - Fetching groups from MongoDB')
    
    // Get user address from request headers or query parameters
    const url = new URL(request.url)
    const userAddress = url.searchParams.get('address')?.toLowerCase()
    const isAdmin = userAddress === ADMIN_WALLET.toLowerCase()
    
    console.log('👤 Request from user:', userAddress, 'Admin access:', isAdmin)
    
    // Fetch groups from MongoDB API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    let endpoint = `${apiUrl}/groups`
    
    if (userAddress) {
      endpoint = `${apiUrl}/users/${userAddress}/groups`
    }
    
    let groups = []
    
    try {
      const response = await fetch(endpoint)
      
      if (!response.ok) {
        console.error(`⚠️ Error fetching groups: ${response.statusText}`)
        // Continue with empty groups array instead of throwing
      } else {
        const result = await response.json()
        
        if (result.success) {
          groups = result.groups || result.data || []
        } else {
          console.error(`⚠️ API returned error: ${result.error || 'Unknown error'}`)
          // Continue with empty groups array
        }
      }
    } catch (fetchError) {
      console.error('❌ Error fetching groups:', fetchError)
      // Continue with empty groups array instead of throwing
    }
    
    console.log('📊 Found groups in MongoDB:', groups.length)
    
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
    } else if (isAdmin) {
      console.log('👑 Admin access granted - returning all groups')
    } else {
      // If no user address and not admin, return empty array
      console.log('⚠️ No user address or admin key provided - returning empty array')
      accessibleGroups = []
    }
    
    return NextResponse.json({
      success: true,
      groups: accessibleGroups
    })
  } catch (error) {
    console.error("❌ Error fetching groups:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { groupId, groupData } = await request.json()
    
    if (!groupId || !groupData) {
      return NextResponse.json({ 
        success: false, 
        error: "Group ID and data are required" 
      }, { status: 400 })
    }

    console.log('📤 POST /api/groups - Creating new group in MongoDB:', groupId)
    
    // Generate invite code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let inviteCode = ''
    for (let i = 0; i < 6; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const groupPayload = {
      groupId,
      ...groupData,
      inviteCode,
      createdAt: new Date().toISOString(),
      version: "1.0",
    }

    console.log('💾 Storing group data in MongoDB...')

    // Store in MongoDB API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const response = await fetch(`${apiUrl}/groups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(groupPayload)
    })
    
    if (!response.ok && response.status !== 409) { // Allow 409 Conflict status
      throw new Error(`Failed to create group: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    // If the group already exists but was returned successfully
    if (result.message && result.message.includes('already exists')) {
      console.log('⚠️ Group already exists, using existing group:', groupId)
      return NextResponse.json({
        success: true,
        group: result.group,
        message: 'Using existing group'
      })
    }
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create group')
    }

    console.log('✅ Group stored successfully in MongoDB:', groupId)

    return NextResponse.json({
      success: true,
      group: result.data || result.group
    })
  } catch (error) {
    console.error("❌ Error creating group in MongoDB:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}