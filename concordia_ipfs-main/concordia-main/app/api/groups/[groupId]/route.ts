
import { NextRequest, NextResponse } from 'next/server'
import { connectToMongoDB } from '@/lib/mongodb'
import { ipfsService } from '@/lib/ipfs-service'

const ADMIN_WALLET = (process.env.ADMIN_ADDRESS || '0x0000000000000000000000000000000000000000').toLowerCase()

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params
    const userAddress = request.headers.get('User-Address')
    
    console.log('📥 GET /api/groups/[groupId] - Loading group from MongoDB:', groupId)

    if (!groupId) {
      return NextResponse.json({
        error: 'Group ID is required'
      }, { status: 400 })
    }

    // Check if user is admin
    const isAdmin = (userAddress || '').toLowerCase() === ADMIN_WALLET

    // Connect to MongoDB
    const client = await connectToMongoDB();
    const collection = client.db().collection('groups');
    
    // Get group data from MongoDB
    const group = await collection.findOne({ id: groupId });

    if (!group) {
      return NextResponse.json({
        error: 'Group not found'
      }, { status: 404 })
    }

    // Check if user has access to the group
    if (!isAdmin && userAddress && 
        group.creator?.toLowerCase() !== userAddress.toLowerCase() && 
        !group.members?.some((m: any) => m.address?.toLowerCase() === userAddress.toLowerCase())) {
      return NextResponse.json({
        error: 'Access denied: You do not have permission to view this group'
      }, { status: 403 })
    }

    console.log('✅ Group loaded successfully from MongoDB:', groupId)
    
    return NextResponse.json({
      success: true,
      metadata: group,
      documentId: group.mongodb?.documentId || groupId,
    })
  } catch (error) {
    console.error('❌ Error loading group from IPFS:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params
    const userAddress = request.headers.get('User-Address')
    
    console.log('🗑️ DELETE /api/groups/[groupId] - Deleting group from IPFS:', groupId)

    if (!groupId || !userAddress) {
      return NextResponse.json({
        error: 'Group ID and user address are required'
      }, { status: 400 })
    }

    // Treat groupId as IPFS hash
    const ipfsHash = groupId

    // Delete group from IPFS (unpin)
    const result = await ipfsService.deleteGroup(ipfsHash, userAddress)

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to delete group from IPFS'
      }, { status: result.error?.includes('Access denied') ? 403 : 500 })
    }

    console.log('✅ Group deleted successfully from IPFS:', groupId)
    
    return NextResponse.json({
      success: true,
      message: 'Group deleted from IPFS',
    })
  } catch (error) {
    console.error('❌ Error deleting group from IPFS:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
