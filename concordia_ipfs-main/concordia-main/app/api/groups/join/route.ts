
import { NextResponse } from 'next/server'
import { ipfsService } from '@/lib/ipfs-service'

// Simple in-memory storage for group index (in production, use a database)
const groupHashIndex: Record<string, string> = {}

export async function POST(request: Request) {
  try {
    const { groupCode, userAddress, nickname } = await request.json()

    console.log('🤝 Join group request:', { groupCode, userAddress, nickname })

    if (!groupCode || !userAddress || !nickname) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the IPFS hash from the group code
    // In a real implementation, you'd validate the code against your system
    const ipfsHash = groupHashIndex[groupCode] || groupCode

    if (!ipfsHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid group code' },
        { status: 404 }
      )
    }

    // Join the group via IPFS
    const result = await ipfsService.joinGroup(ipfsHash, userAddress, nickname)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to join group' },
        { status: 500 }
      )
    }

    // Update the group hash index if we got a new hash
    if (result.newIpfsHash) {
      groupHashIndex[groupCode] = result.newIpfsHash
    }

    return NextResponse.json({
      success: true,
      data: {
        ipfsHash: result.newIpfsHash || ipfsHash,
        message: 'Successfully joined group'
      }
    })

  } catch (error) {
    console.error('❌ Error in join group API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupCode = searchParams.get('code')

    if (!groupCode) {
      return NextResponse.json(
        { success: false, error: 'Group code required' },
        { status: 400 }
      )
    }

    // Get group info from IPFS
    const ipfsHash = groupHashIndex[groupCode] || groupCode
    
    const result = await ipfsService.getGroupData(ipfsHash)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        groupId: result.data?.groupId,
        name: result.data?.name,
        description: result.data?.description,
        memberCount: result.data?.members?.length || 0,
        goalAmount: result.data?.goalAmount,
        ipfsHash
      }
    })

  } catch (error) {
    console.error('❌ Error getting group info:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
