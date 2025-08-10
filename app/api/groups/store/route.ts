import { NextRequest, NextResponse } from 'next/server'

const ADMIN_WALLET = process.env.ADMIN_ADDRESS || '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 POST /api/groups/store - Storing group data in MongoDB')

    const { groupId, groupData, userAddress } = await request.json()

    if (!groupId || !groupData || !userAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: groupId, groupData, userAddress'
      }, { status: 400 })
    }

    // Check if user is admin or has access to the group
    const isAdmin = userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()

    if (!isAdmin && groupData.groupId) {
      // Check if user has write access to the group if not admin and it's an update
      try {
        const accessResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/groups/${groupId}/access?address=${userAddress}`)
        const accessResult = await accessResponse.json()

        if (!accessResult.canWrite) {
          return NextResponse.json({
            success: false,
            error: 'Access denied: You do not have permission to modify this group'
          }, { status: 403 })
        }
      } catch (accessError) {
        console.warn('⚠️ Could not verify access, proceeding with storage')
      }
    }
    
    // Check if group already exists
    try {
      const checkResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/groups/${groupId}`)
      if (checkResponse.ok) {
        const checkResult = await checkResponse.json()
        if (checkResult.success && checkResult.metadata) {
          console.log('⚠️ Group already exists, proceeding with update:', groupId)
        }
      }
    } catch (checkError) {
      console.warn('⚠️ Could not check if group exists, proceeding with storage')
    }

    // Prepare the group data with required fields
    const updatedGroupData = {
      ...groupData,
      groupId,
      updatedAt: new Date().toISOString(),
    }

    if (!updatedGroupData.createdAt) {
      updatedGroupData.createdAt = updatedGroupData.updatedAt
    }

    if (!updatedGroupData.creator) {
      updatedGroupData.creator = userAddress
    }

    if (!updatedGroupData.members) {
      updatedGroupData.members = [{
        address: userAddress,
        nickname: "Creator",
        contributed: 0,
        auraPoints: 0,
        status: "active",
        role: "admin",
        joinedAt: updatedGroupData.createdAt
      }]
    }

    // Generate invite code if not present
    if (!updatedGroupData.inviteCode) {
      const randomCode = Math.random().toString(36).substring(2, 10).toUpperCase()
      updatedGroupData.inviteCode = `${randomCode}-${groupId.substring(0, 4)}`
    }

    console.log('💾 Storing group data in MongoDB...')

    // Store in MongoDB API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const isUpdate = groupData.groupId ? true : false
    const endpoint = isUpdate ? `${apiUrl}/groups/${groupId}` : `${apiUrl}/groups`
    const method = isUpdate ? 'PUT' : 'POST'
    
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedGroupData)
    })
    
    if (!response.ok) {
      throw new Error(`Failed to store group: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to store group')
    }

    console.log('✅ Group stored successfully in MongoDB:', groupId)

    return NextResponse.json({
      success: true,
      group: result.data
    })
  } catch (error) {
    console.error('❌ Error storing group data in MongoDB:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}