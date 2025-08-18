
import { NextResponse } from 'next/server'
import { arweaveService } from '@/lib/arweave-service'
import connectToDatabase from '@/lib/mongodb'
import Group from '@/lib/models/Group'

// Group model is imported from lib/models/Group

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

    // Connect to MongoDB
    await connectToDatabase()
    
    // Prepare group data for MongoDB
    const mongoGroupData = {
      ...groupData,
      updatedAt: new Date().toISOString()
    }
    
    // Store in MongoDB
    let mongoResult
    try {
      // Check if group already exists
      let group = await Group.findOne({ groupId: groupData.groupId })
      
      if (group) {
        // Update existing group
        Object.assign(group, mongoGroupData)
        mongoResult = await group.save()
        console.log("✅ Group data updated in MongoDB:", groupData.groupId)
      } else {
        // Create new group
        const newGroup = new Group(mongoGroupData)
        mongoResult = await newGroup.save()
        console.log("✅ Group data stored in MongoDB:", groupData.groupId)
      }
    } catch (mongoError) {
      console.error("❌ Error storing group data in MongoDB:", mongoError)
      return NextResponse.json(
        { success: false, error: 'Failed to store group data in MongoDB' },
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
        mongodb: {
          success: true,
          groupId: groupData.groupId
        },
        arweave: {
          transactionId: arweaveResult.transactionId,
          success: arweaveResult.success
        },
        message: 'Group data stored successfully in MongoDB and Arweave'
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

    // Connect to MongoDB
    await connectToDatabase()
    
    // Get user groups from MongoDB
    const groups = await Group.find({
      $or: [
        { creator: userAddress.toLowerCase() },
        { 'members.address': userAddress.toLowerCase() }
      ]
    }).lean()

    return NextResponse.json({
      success: true,
      data: groups || [],
      source: 'mongodb'
    })

  } catch (error) {
    console.error('❌ Error getting user groups:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
