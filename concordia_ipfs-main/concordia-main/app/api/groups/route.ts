import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { connectToMongoDB } from '@/lib/mongodb'
import { dataPersistenceService } from '@/lib/data-persistence'

const ADMIN_WALLET = process.env.ADMIN_ADDRESS || "0xdA13e8F82C83d14E7aa639354054B7f914cA0998"

export async function GET(request: Request) {
  try {
    console.log('📥 GET /api/groups - Fetching groups from MongoDB')
    
    // Get user address from request headers or query parameters
    const url = new URL(request.url)
    const userAddress = url.searchParams.get('address')?.toLowerCase()
    const isAdmin = userAddress === ADMIN_WALLET.toLowerCase()
    
    console.log('👤 Request from user:', userAddress, 'Admin access:', isAdmin)
    
    // Connect to MongoDB
    const client = await connectToMongoDB()
    const db = client.db('concordia')
    const groupsCollection = db.collection('groups')
    
    // Fetch all groups from MongoDB
    const groups = await groupsCollection.find({}).toArray()
    
    console.log('📊 Found groups in MongoDB:', groups.length)
    
    if (groups.length === 0) {
      console.log('📭 No groups found in MongoDB')
      
      // Try to fetch from data persistence service as fallback
      console.log('🔍 Checking data persistence service for groups...')
      const persistedGroups = await dataPersistenceService.loadGroups()
      
      if (persistedGroups && persistedGroups.length > 0) {
        console.log('✅ Found groups in data persistence service:', persistedGroups.length)
        
        // Store these groups in MongoDB for future access
        try {
          await groupsCollection.insertMany(persistedGroups)
          console.log('✅ Migrated persisted groups to MongoDB')
        } catch (error) {
          console.warn('⚠️ Failed to migrate persisted groups to MongoDB:', error)
        }
        
        return NextResponse.json({
          success: true,
          groups: persistedGroups
        })
      }
      
      return NextResponse.json({
        success: true,
        groups: []
      })
    }
    
    // Filter groups based on user access
    let accessibleGroups = groups
    
    if (!isAdmin && userAddress) {
      // Regular users can only see groups they are part of
      accessibleGroups = groups.filter((group: any) => {
        const isCreator = group.creator?.toLowerCase() === userAddress
        const isMember = group.members?.some((member: any) => 
          member.address?.toLowerCase() === userAddress
        )
        return isCreator || isMember
      })
      console.log('🔒 Filtered groups for user access:', accessibleGroups.length)
      
      // Store user stats in database for admin tracking
      if (accessibleGroups.length > 0) {
        try {
          const userStats = accessibleGroups.reduce((acc, group) => ({
            totalContributed: acc.totalContributed + (group.currentAmount || 0),
            totalAura: acc.totalAura + (group.members?.find((m: any) => m.address?.toLowerCase() === userAddress)?.auraPoints || 0)
          }), { totalContributed: 0, totalAura: 0 })
          
          // Store user stats in MongoDB
          const userStatsCollection = db.collection('user_stats')
          await userStatsCollection.updateOne(
            { userAddress },
            { 
              $set: { 
                ...userStats,
                lastUpdated: new Date().toISOString() 
              } 
            },
            { upsert: true }
          )
          
          console.log('📊 User stats stored in MongoDB:', userStats)
        } catch (error) {
          console.log('⚠️ Error storing user stats:', error)
        }
      }
    } else if (isAdmin) {
      console.log('👑 Admin access granted - returning all groups')
    } else {
      // If no user address and not admin, return empty array
      console.log('⚠️ No user address or admin key provided - returning empty array')
      accessibleGroups = []
    }
    
    return NextResponse.json({
      success: true,
      groups: accessibleGroups,
    })
  } catch (error) {
    console.error("❌ Error retrieving groups from MongoDB:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      error: "Failed to retrieve groups from MongoDB",
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log('📤 POST /api/groups - Creating new group in MongoDB with IPFS backup')
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.creator || !body.targetAmount) {
      console.error('❌ Missing required fields in request body')
      return NextResponse.json({
        error: "Missing required fields",
        details: "name, creator, and targetAmount are required"
      }, { status: 400 })
    }
    
    // Connect to MongoDB
    const client = await connectToMongoDB()
    const db = client.db('concordia')
    const groupsCollection = db.collection('groups')
    
    // Check if a group with the same name and creator already exists
    const existingGroup = await groupsCollection.findOne({
      name: body.name,
      creator: body.creator
    })
    
    if (existingGroup) {
      console.log('⚠️ Group with same name and creator already exists')
      return NextResponse.json({
        error: "Duplicate group",
        details: "A group with this name already exists for this creator"
      }, { status: 400 })
    }
    
    // Generate a unique group ID
    const groupId = uuidv4()
    console.log('🆔 Generated group ID:', groupId)
    
    // Generate a unique invite code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let inviteCode = ''
    for (let i = 0; i < 6; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    console.log('🎟️ Generated invite code:', inviteCode)
    
    // Create the group object
    const group = {
      ...body,
      groupId,
      inviteCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currentAmount: 0,
      members: [{
        address: body.creator,
        joinedAt: new Date().toISOString(),
        auraPoints: 0,
        isCreator: true
      }]
    }
    
    console.log('📦 Group object created:', group)
    
    // Store the group in MongoDB
    await groupsCollection.insertOne(group)
    console.log('✅ Group stored in MongoDB')
    
    // Store redundant copy in data persistence service
    let persistenceResult = null
    try {
      const result = await dataPersistenceService.saveGroup(group)
      if (result.success) {
        persistenceResult = result
        // Update the group with persistence metadata for reference
        await groupsCollection.updateOne(
          { groupId },
          { $set: { 
            'mongodb.documentId': groupId,
            'mongodb.collection': 'groups',
            'mongodb.lastUpdated': new Date().toISOString()
          }}
        )
        console.log('✅ Group data backed up to MongoDB')
      } else {
        console.warn('⚠️ Failed to backup group to MongoDB:', result.error)
      }
    } catch (dbError) {
      console.error('❌ Error backing up to MongoDB:', dbError)
      // Continue since primary MongoDB storage already succeeded
    }
    
    return NextResponse.json({
      success: true,
      group,
      joinUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join?code=${inviteCode}`
    })
  } catch (error) {
    console.error("❌ Error creating group in MongoDB:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      error: "Failed to create group in MongoDB",
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}