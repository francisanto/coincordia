import { NextResponse } from 'next/server'
import { connectToMongoDB } from '@/lib/mongodb'

const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

export async function GET(request: Request, { params }: { params: { groupId: string } }) {
  try {
    const { groupId } = params
    const url = new URL(request.url)
    const userAddress = url.searchParams.get('address')

    console.log('🔐 Checking access for group:', groupId, 'user:', userAddress)

    if (!userAddress) {
      return NextResponse.json({
        canRead: false,
        canWrite: false,
        isCreator: false,
        error: 'User address required'
      }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await connectToMongoDB()
    const collection = client.db().collection('groups')

    // Get group data to check membership
    try {
      // Get the group data from MongoDB
      const groupData = await collection.findOne({ groupId })
      
      if (!groupData) {
        return NextResponse.json({
          canRead: false,
          canWrite: false,
          isCreator: false,
          isMember: false,
          error: 'Group not found'
        }, { status: 404 })
      }

      // Check if user is admin
      const isAdmin = userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()
      
      // If user is admin, they have full access
      if (isAdmin) {
        return NextResponse.json({
          canRead: true,
          canWrite: true,
          isCreator: false,
          isMember: false,
          isAdmin: true,
          groupId: groupId,
          userAddress: userAddress,
        })
      }

      // Check if user is creator
      const isCreator = groupData.creator?.toLowerCase() === userAddress.toLowerCase()

      // Check if user is a member
      const isMember = groupData.members?.some(
        (member: any) => member.address?.toLowerCase() === userAddress.toLowerCase()
      )

      return NextResponse.json({
        canRead: isCreator || isMember,
        canWrite: isCreator,
        isCreator,
        isMember,
        isAdmin: false,
        groupId: groupId,
        userAddress: userAddress,
      })

    } catch (accessError) {
      console.error('❌ Error checking group access in MongoDB:', accessError)

      // If we can't access the group, user has no permissions
      return NextResponse.json({
        canRead: false,
        canWrite: false,
        isCreator: false,
        isAdmin: false,
        isMember: false,
        error: 'Failed to check group access',
        details: accessError instanceof Error ? accessError.message : 'Unknown error',
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Error in access check:', error)
    return NextResponse.json({
      canRead: false,
      canWrite: false,
      isCreator: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}