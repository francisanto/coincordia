
import { NextRequest, NextResponse } from 'next/server'
import { ipfsService } from '@/lib/ipfs-service'

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

    // Verify user has permission to create invite for this group
    const groupResult = await ipfsService.getGroupData(groupId)
    if (!groupResult.success || !groupResult.data) {
      return NextResponse.json({
        success: false,
        error: 'Group not found'
      }, { status: 404 })
    }

    const group = groupResult.data
    const isCreator = group.creator?.toLowerCase() === createdBy.toLowerCase()
    const isAdmin = createdBy.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_WALLET?.toLowerCase()

    if (!isCreator && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'Only the group creator or admin can generate invite codes'
      }, { status: 403 })
    }

    // Store invite code in IPFS
    const result = await ipfsService.storeInviteCode(groupId, code, createdBy)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to generate group code'
      }, { status: 500 })
    }

    console.log('✅ Group code generated successfully:', code)

    return NextResponse.json({
      success: true,
      code: code,
      ipfsHash: result.ipfsHash
    })

  } catch (error) {
    console.error('❌ Error generating group code:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate group code'
    }, { status: 500 })
  }
}
