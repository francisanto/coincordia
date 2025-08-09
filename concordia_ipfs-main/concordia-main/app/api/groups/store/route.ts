
import { NextResponse } from 'next/server'
import { arweaveService } from '@/lib/arweave-service'
import { ipfsService } from '@/lib/ipfs-service'

export async function POST(request: Request) {
  try {
    const groupData = await request.json()
    const userAddress = request.headers.get('x-user-address')

    console.log('💾 Store group request:', { groupId: groupData.groupId, userAddress })

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address required' },
        { status: 400 }
      )
    }

    if (!groupData.groupId || !groupData.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required group data' },
        { status: 400 }
      )
    }

    // Store in IPFS
    const ipfsResult = await ipfsService.storeGroupData(
      groupData.groupId,
      groupData,
      userAddress
    )

    if (!ipfsResult.success) {
      return NextResponse.json(
        { success: false, error: ipfsResult.error || 'Failed to store group data in IPFS' },
        { status: 500 }
      )
    }
    
    // Store in Arweave
    const arweaveResult = await arweaveService.storeGroupData(
      groupData.groupId,
      groupData,
      userAddress
    )

    return NextResponse.json({
      success: true,
      data: {
        ipfs: {
          ipfsHash: ipfsResult.ipfsHash,
          gatewayUrl: ipfsService.getGatewayUrl(ipfsResult.ipfsHash!)
        },
        arweave: {
          transactionId: arweaveResult.transactionId,
          success: arweaveResult.success
        },
        message: 'Group data stored successfully in IPFS and Arweave'
      }
    })

  } catch (error) {
    console.error('❌ Error in store group API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userAddress = searchParams.get('userAddress')

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address required' },
        { status: 400 }
      )
    }

    // Get user groups from IPFS
    const result = await ipfsService.getUserGroups(userAddress)

    return NextResponse.json({
      success: result.success,
      data: result.data || [],
      error: result.error
    })

  } catch (error) {
    console.error('❌ Error getting user groups:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
