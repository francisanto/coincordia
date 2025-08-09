import { NextRequest, NextResponse } from 'next/server'

// This would be imported from your storage service in production
const groups: Record<string, any> = {}
const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

function validateUserAddress(userAddress: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(userAddress)
}

function hasReadAccess(group: any, userAddress: string): boolean {
  if (userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()) {
    return true
  }

  if (group.creator?.toLowerCase() === userAddress.toLowerCase()) {
    return true
  }

  return group.members?.some((member: any) =>
    member.address?.toLowerCase() === userAddress.toLowerCase()
  )
}

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const userAddress = request.headers.get('X-User-Address')
    const { groupId } = params

    if (!userAddress || !validateUserAddress(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid or missing user address' },
        { status: 401 }
      )
    }

    const group = groups[groupId]

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    if (!hasReadAccess(group, userAddress)) {
      return NextResponse.json(
        { error: 'Access denied: You cannot view this group' },
        { status: 403 }
      )
    }

    console.log('✅ Group accessed:', groupId, 'by:', userAddress)
    return NextResponse.json(group)

  } catch (error) {
    console.error('❌ Error loading group:', error)
    return NextResponse.json(
      { error: 'Failed to load group' },
      { status: 500 }
    )
  }
}