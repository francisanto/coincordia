
import { NextRequest, NextResponse } from 'next/server'
import { connectToMongoDB } from '@/lib/mongodb'

const ADMIN_WALLET = process.env.ADMIN_ADDRESS || '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 POST /api/groups/store - Storing group data in MongoDB')

    const { groupId, groupData, userAddress } = await request.json()

    if (!groupId || !groupData || !userAddress) {
      return NextResponse.json({
        error: 'Missing required fields: groupId, groupData, userAddress'
      }, { status: 400 })
    }

    // Check if user is admin
    const isAdmin = userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()

    if (!isAdmin) {
      // For new groups, creator has access
      // For existing groups, check if user is member or creator
      if (groupData.creator && groupData.creator.toLowerCase() !== userAddress.toLowerCase()) {
        const isMember = groupData.members?.some((member: any) => 
          member.address?.toLowerCase() === userAddress.toLowerCase()
        )
        
        if (!isMember) {
          return NextResponse.json({
            error: 'Access denied: You do not have permission to modify this group'
          }, { status: 403 })
        }
      }
    }

    try {
      // Connect to MongoDB
      const client = await connectToMongoDB();
      const collection = client.db().collection('groups');
      
      // Add timestamps and MongoDB metadata
      const updatedGroupData = {
        ...groupData,
        id: groupId,
        updatedAt: new Date().toISOString(),
        mongodb: {
          documentId: groupId,
          collection: 'groups',
          lastUpdated: new Date().toISOString()
        }
      };
      
      // Check if group already exists
      const existingGroup = await collection.findOne({ id: groupId });
      
      let result;
      if (existingGroup) {
        // Update existing group
        result = await collection.updateOne(
          { id: groupId },
          { $set: updatedGroupData }
        );
      } else {
        // Create new group
        updatedGroupData.createdAt = new Date().toISOString();
        result = await collection.insertOne(updatedGroupData);
      }
      
      if (!result.acknowledged) {
        throw new Error('Failed to store group data in MongoDB');
      }
      
      console.log('✅ Group data stored successfully in MongoDB:', groupId);
      
      return NextResponse.json({
        success: true,
        documentId: groupId,
        metadata: updatedGroupData,
    })
  } catch (error) {
    console.error('❌ Error storing group data in IPFS:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
  }
