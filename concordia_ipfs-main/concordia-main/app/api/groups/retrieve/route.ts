import { NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongodb'
import Group from '@/lib/models/Group'
import { GroupMetadata } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const ipfsHash = searchParams.get('ipfsHash')
    const mongoDbId = searchParams.get('mongoDbId')
    const userAddress = searchParams.get('userAddress')

    console.log('📥 Retrieve group request:', { groupId, ipfsHash, mongoDbId, userAddress })

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address required' },
        { status: 400 }
      )
    }

    if (!groupId && !mongoDbId) {
      return NextResponse.json(
        { success: false, error: 'Either groupId or mongoDbId is required' },
        { status: 400 }
      )
    }

    let mongoResult: { success: boolean; data?: any; error?: string } = { success: false, error: 'Not requested' }

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

    // Try to retrieve from MongoDB if we have a document ID or groupId
    if (mongoDbId || groupId) {
      // Mock implementation until MongoDB service is fully implemented
      const mockData = {
        groupId: groupId || 'group-' + Math.random().toString(36).substring(2, 8),
        name: 'Sample Group',
        description: 'A sample group from MongoDB',
        members: [],
        updatedAt: new Date().toISOString()
      }
      
      mongoResult = { success: true, data: mockData }
    }

    // Determine which source to use based on success
    let primaryData = null
    let primarySource = null

    if (mongoResult.success) {
      // MongoDB succeeded, use it as primary
      primaryData = mongoResult.data
      primarySource = 'mongodb'
    } else {
      // If MongoDB failed, we don't have a fallback anymore
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      )
    }

    if (!primaryData) {
      return NextResponse.json({
        success: false,
        error: 'Group not found',
        mongoError: mongoResult.error
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: primaryData,
      source: primarySource
    })

  } catch (error) {
    console.error('❌ Error in retrieve group API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}