import { NextResponse } from 'next/server'

const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

// Simple in-memory storage for group index (in production, use a database)
let groupIndex: { [groupId: string]: { ipfsHash: string; creator: string; members: string[] } } = {}

export async function GET(request: Request, { params }: { params: { groupId: string } }) {
  try {
    const { groupId } = params
    const url = new URL(request.url)
    const userAddress = url.searchParams.get('address')?.toLowerCase()

    console.log('🔍 Checking access for group:', groupId, 'user:', userAddress)

    if (!userAddress) {
      return NextResponse.json({
        canRead: false,
        canWrite: false,
        isCreator: false,
        isAdmin: false,
        error: 'User address required'
      })
    }

    // Get group info from index
    const groupInfo = groupIndex[groupId]
    if (!groupInfo) {
      return NextResponse.json({
        canRead: false,
        canWrite: false,
        isCreator: false,
        isAdmin: false,
        error: 'Group not found'
      })
    }

    const isAdmin = userAddress === ADMIN_WALLET.toLowerCase()
    const isCreator = groupInfo.creator.toLowerCase() === userAddress
    const isMember = groupInfo.members.some(member => member.toLowerCase() === userAddress)

    return NextResponse.json({
      canRead: isAdmin || isCreator || isMember,
      canWrite: isAdmin || isCreator || isMember,
      isCreator,
      isAdmin,
    })
  } catch (error) {
    console.error('❌ Error checking group access:', error)
    return NextResponse.json({
      canRead: false,
      canWrite: false,
      isCreator: false,
      isAdmin: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}