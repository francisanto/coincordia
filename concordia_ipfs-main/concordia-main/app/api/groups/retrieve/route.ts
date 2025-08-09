import { NextResponse } from 'next/server'
import { arweaveService } from '@/lib/arweave-service'
import { ipfsService } from '@/lib/ipfs-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const ipfsHash = searchParams.get('ipfsHash')
    const arweaveId = searchParams.get('arweaveId')
    const userAddress = searchParams.get('userAddress')

    console.log('📥 Retrieve group request:', { groupId, ipfsHash, arweaveId, userAddress })

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address required' },
        { status: 400 }
      )
    }

    if (!groupId && !ipfsHash && !arweaveId) {
      return NextResponse.json(
        { success: false, error: 'Either groupId, ipfsHash, or arweaveId is required' },
        { status: 400 }
      )
    }

    let ipfsResult = { success: false, data: null, error: 'Not requested' }
    let arweaveResult = { success: false, data: null, error: 'Not requested' }

    // Try to retrieve from IPFS if we have a hash or groupId
    if (ipfsHash || groupId) {
      if (ipfsHash) {
        ipfsResult = await ipfsService.getGroupDataByHash(ipfsHash)
      } else if (groupId) {
        ipfsResult = await ipfsService.getGroupData(groupId, userAddress)
      }
    }

    // Try to retrieve from Arweave if we have a transaction ID or groupId
    if (arweaveId || groupId) {
      if (arweaveId) {
        arweaveResult = await arweaveService.getGroupData(arweaveId, userAddress)
      } else if (groupId && arweaveResult.success === false) {
        // Try to find by groupId in Arweave if we have a groupId and IPFS failed
        // This would require a lookup mechanism in a real implementation
        // For demo, we'll simulate this with a direct call
        arweaveResult = await arweaveService.getGroupData(`AR${groupId}`, userAddress)
      }
    }

    // Determine which source to use based on success and data freshness
    let primaryData = null
    let primarySource = null
    let secondaryData = null
    let secondarySource = null

    if (ipfsResult.success && arweaveResult.success) {
      // Both succeeded, use the most recently updated one as primary
      const ipfsUpdatedAt = new Date(ipfsResult.data?.updatedAt || 0)
      const arweaveUpdatedAt = new Date(arweaveResult.data?.updatedAt || 0)

      if (ipfsUpdatedAt >= arweaveUpdatedAt) {
        primaryData = ipfsResult.data
        primarySource = 'ipfs'
        secondaryData = arweaveResult.data
        secondarySource = 'arweave'
      } else {
        primaryData = arweaveResult.data
        primarySource = 'arweave'
        secondaryData = ipfsResult.data
        secondarySource = 'ipfs'
      }
    } else if (ipfsResult.success) {
      primaryData = ipfsResult.data
      primarySource = 'ipfs'
    } else if (arweaveResult.success) {
      primaryData = arweaveResult.data
      primarySource = 'arweave'
    }

    if (!primaryData) {
      return NextResponse.json({
        success: false,
        error: 'Group data not found in either IPFS or Arweave',
        ipfsError: ipfsResult.error,
        arweaveError: arweaveResult.error
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: primaryData,
      primarySource,
      secondaryData,
      secondarySource,
      sources: {
        ipfs: {
          success: ipfsResult.success,
          error: ipfsResult.error,
          hash: ipfsHash || (ipfsResult.success ? ipfsResult.ipfsHash : null),
          gatewayUrl: ipfsResult.success ? ipfsService.getGatewayUrl(ipfsResult.ipfsHash!) : null
        },
        arweave: {
          success: arweaveResult.success,
          error: arweaveResult.error,
          transactionId: arweaveId || (arweaveResult.success ? arweaveResult.transactionId : null)
        }
      }
    })

  } catch (error) {
    console.error('❌ Error in retrieve group API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}