import { NextResponse } from 'next/server'
import { ipfsService } from '@/lib/ipfs-service'
import { connectToMongoDB } from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'

const ADMIN_WALLET = (process.env.ADMIN_ADDRESS || '0x0000000000000000000000000000000000000000').toLowerCase()

export async function GET(request: Request) {
  try {
    console.log('📥 GET /api/groups/join - Joining group by invite code')
    
    // Get invite code and user address from query parameters
    const url = new URL(request.url)
    const inviteCode = url.searchParams.get('invite_code')
    const userAddress = url.searchParams.get('address')?.toLowerCase()
    
    if (!inviteCode || !userAddress) {
      return NextResponse.json({
        success: false,
        error: "Invite code and user address are required"
      }, { status: 400 })
    }
    
    console.log('🔍 Looking for group with invite code:', inviteCode)
    
    // Connect to MongoDB to find the group with the invite code
    const client = await connectToMongoDB()
    const db = client.db('concordia')
    const groupsCollection = db.collection('groups')
    
    // Find the group with the matching invite code
    const targetGroup = await groupsCollection.findOne({ inviteCode: inviteCode })
    
    if (!targetGroup) {
      // If not found in MongoDB, try to find in IPFS (for backward compatibility)
      console.log('⚠️ Group not found in MongoDB, checking IPFS...')
      
      // This would require maintaining an index of IPFS hashes and invite codes
      // For now, return error as we don't have a way to search all IPFS content by invite code
      return NextResponse.json({
        success: false,
        error: "Invalid invite code"
      }, { status: 404 })
    }

    // Check if user is already a member
    const isAlreadyMember = targetGroup.members.some((member: any) => 
      member.address?.toLowerCase() === userAddress
    )

    if (isAlreadyMember) {
      return NextResponse.json({
        success: false,
        error: "You are already a member of this group"
      }, { status: 400 })
    }

    // Add user to the group
    targetGroup.members.push({
      address: userAddress,
      nickname: "Member",
      contribution: 0,
      auraPoints: 0,
      status: "active",
      role: "member",
      joinedAt: new Date().toISOString()
    })

    targetGroup.updatedAt = new Date().toISOString()

    // Update the group in MongoDB
    // We already have the MongoDB client from above, no need to reconnect
    
    await groupsCollection.updateOne(
      { groupId: targetGroup.groupId },
      { $set: targetGroup }
    )
    
    // Also update in IPFS for redundancy
    const ipfsResult = await ipfsService.storeGroupData(
      targetGroup.groupId,
      targetGroup,
      ADMIN_WALLET // Use admin wallet to ensure write access
    )
    
    if (ipfsResult.success) {
      console.log('✅ Group data also updated in IPFS:', ipfsResult.ipfsHash)
    } else {
      console.warn('⚠️ Failed to update group in IPFS, but MongoDB update succeeded')
    }

    console.log('✅ User added to group successfully:', targetGroup.groupId)

    return NextResponse.json({
      success: true,
      message: "Successfully joined the group",
      group: {
        id: targetGroup.groupId,
        name: targetGroup.name
      }
    })
  } catch (error) {
    console.error("❌ Error joining group:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      success: false,
      error: "Failed to join group",
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * Generate a new invite code for a group
 */
export async function POST(request: Request) {
  try {
    console.log('📤 POST /api/groups/join - Creating new invite code')
    
    const body = await request.json()
    const { groupId, userAddress } = body
    
    if (!groupId || !userAddress) {
      return NextResponse.json({
        success: false,
        error: "Group ID and user address are required"
      }, { status: 400 })
    }
    
    // Connect to MongoDB
    const client = await connectToMongoDB()
    const db = client.db('concordia')
    const groupsCollection = db.collection('groups')
    
    // Find the group
    const group = await groupsCollection.findOne({ groupId })
    
    if (!group) {
      return NextResponse.json({
        success: false,
        error: "Group not found"
      }, { status: 404 })
    }
    
    // Check if user is creator or admin
    const isAdmin = userAddress.toLowerCase() === ADMIN_WALLET
    const isCreator = group.creator?.toLowerCase() === userAddress.toLowerCase()
    
    if (!isAdmin && !isCreator) {
      return NextResponse.json({
        success: false,
        error: "Only group creator or admin can generate invite codes"
      }, { status: 403 })
    }
    
    // Generate a new invite code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let inviteCode = ''
    for (let i = 0; i < 8; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // Update the group with the new invite code
    await groupsCollection.updateOne(
      { groupId },
      { $set: { 
        inviteCode,
        updatedAt: new Date().toISOString() 
      }}
    )
    
    console.log('✅ New invite code generated:', inviteCode)
    
    // Also update in IPFS for redundancy
    const updatedGroup = await groupsCollection.findOne({ groupId })
    if (updatedGroup) {
      const ipfsResult = await ipfsService.storeGroupData(
        groupId,
        updatedGroup,
        ADMIN_WALLET // Use admin wallet to ensure write access
      )
      
      if (ipfsResult.success) {
        console.log('✅ Group data with new invite code also updated in IPFS:', ipfsResult.ipfsHash)
      }
    }
    
    console.log('✅ New invite code generated for group:', groupId)
    
    return NextResponse.json({
      success: true,
      inviteCode,
      joinUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join?code=${inviteCode}`
    })
  } catch (error) {
    console.error("❌ Error creating invite code:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      success: false,
      error: "Failed to create invite code",
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}