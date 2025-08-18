
import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import Group from '@/lib/models/Group'

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 POST /api/groups/codes/generate - Generating group code')

    const { groupId, code, createdBy } = await request.json()
    const userAddress = request.headers.get('x-user-address')

    if (!groupId || !code || !createdBy) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: groupId, code, createdBy'
      }, { status: 400 })
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(createdBy)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid wallet address format'
      }, { status: 400 })
    }

    // Connect to MongoDB
    await connectToDatabase()
    
    // Verify user has permission to create invite for this group
    const group = await Group.findOne({ groupId })
    if (!group) {
      return NextResponse.json({
        success: false,
        error: 'Group not found'
      }, { status: 404 })
    }

    const isCreator = group.creator?.toLowerCase() === createdBy.toLowerCase()
    const isAdmin = createdBy.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase()

    if (!isCreator && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Only the group creator or admin can generate invite codes'
      }, { status: 403 })
    }

    // Store invite code in MongoDB
    try {
      group.inviteCode = code
      group.updatedAt = new Date().toISOString()
      await group.save()
      
      console.log('✅ Group code generated successfully:', code)

      return NextResponse.json({
        success: true,
        code: code,
        groupId: groupId
      })
    } catch (error) {
      console.error('❌ Error saving invite code to MongoDB:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to save invite code'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error generating group code:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate group code'
    }, { status: 500 })
  }
}
