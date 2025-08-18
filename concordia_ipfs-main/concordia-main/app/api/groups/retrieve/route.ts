import { NextResponse } from 'next/server'
import { arweaveService } from '@/lib/arweave-service'
import connectToDatabase from '@/lib/mongodb'
import Group from '@/lib/models/Group'

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

    if (!groupId && !arweaveId) {
      return NextResponse.json(
        { success: false, error: 'Either groupId or arweaveId is required' },
        { status: 400 }
      )
    }

    let mongoResult: { success: boolean; data?: any; error?: string } = { success: false, error: 'Not requested' }
    let arweaveResult: { success: boolean; data?: any; error?: string } = { success: false, error: 'Not requested' }

    // Connect to MongoDB
    await connectToDatabase()

    // Try to retrieve from MongoDB if we have a groupId
    if (groupId) {
      try {
        const group = await Group.findOne({ groupId }).lean()
        if (group) {
          mongoResult = { success: true, data: group }
          console.log(`✅ Retrieved group ${groupId} from MongoDB`)
        } else {
          mongoResult = { success: false, error: 'Group not found in MongoDB' }
        }
      } catch (mongoError) {
        console.error(`❌ Error retrieving group ${groupId} from MongoDB:`, mongoError)
        mongoResult = { success: false, error: 'Database error' }
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

    if (mongoResult.success && arweaveResult.success) {
      // Both succeeded, use the most recently updated one as primary
      const mongoUpdatedAt = new Date(mongoResult.data?.updatedAt || 0)
      const arweaveUpdatedAt = new Date(arweaveResult.data?.updatedAt || 0)

      if (mongoUpdatedAt >= arweaveUpdatedAt) {
        primaryData = mongoResult.data
        primarySource = 'mongodb'
        secondaryData = arweaveResult.data
        secondarySource = 'arweave'
      } else {
        primaryData = arweaveResult.data
        primarySource = 'arweave'
        secondaryData = mongoResult.data
        secondarySource = 'mongodb'
      }
    } else if (mongoResult.success) {
      primaryData = mongoResult.data
      primarySource = 'mongodb'
    } else if (arweaveResult.success) {
      primaryData = arweaveResult.data
      primarySource = 'arweave'
    }

    if (!primaryData) {
      return NextResponse.json({
        success: false,
        error: 'Group data not found in either MongoDB or Arweave',
        mongoError: mongoResult.error,
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
        mongodb: {
          success: mongoResult.success,
          error: mongoResult.error,
          groupId: groupId
        },
        arweave: {
          success: arweaveResult.success,
          error: arweaveResult.error,
          transactionId: arweaveId || (arweaveResult.success && arweaveResult.data ? arweaveResult.data.arweaveId : null)
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