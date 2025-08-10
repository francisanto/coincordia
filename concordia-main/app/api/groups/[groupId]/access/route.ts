import { NextResponse } from 'next/server'

const ADMIN_WALLET = process.env.ADMIN_ADDRESS || '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

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

    // Check if user is admin
    const isAdmin = userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()
    
    if (isAdmin) {
      return NextResponse.json({
        canRead: true,
        canWrite: true,
        isCreator: true,
        isMember: true,
        isAdmin: true,
        groupId: groupId,
        userAddress: userAddress,
      })
    }

    // Get group data to check membership
    try {
      // Fetch group data from MongoDB API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      const response = await fetch(`${apiUrl}/groups/${groupId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch group data: ${response.statusText}`)
      }
      
      const groupData = await response.json()
      
      if (!groupData.success || !groupData.data) {
        throw new Error('Group not found')
      }
      
      const group = groupData.data
      
      // Check if user is creator
      const isCreator = group.createdBy?.toLowerCase() === userAddress.toLowerCase()
      
      // Check if user is a member
      const isMember = group.members?.some((member: any) => 
        member.address?.toLowerCase() === userAddress.toLowerCase()
      ) || isCreator
      // Determine access levels
      return NextResponse.json({
        canRead: isCreator || isMember,
        canWrite: isCreator,
        isCreator: isCreator,
        isMember: isMember,
        groupId: groupId,
        userAddress: userAddress,
      })

    } catch (accessError) {
      console.error('❌ Error checking group access:', accessError)

      // If we can't access the group, user has no permissions
      return NextResponse.json({
        canRead: false,
        canWrite: false,
        isCreator: false,
        isMember: false,
        error: 'Group not found or access denied',
      }, { status: 404 })
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