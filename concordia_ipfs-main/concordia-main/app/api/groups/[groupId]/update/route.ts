import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { updates } = await request.json();

    console.log('🔄 Updating group metadata in MongoDB:', { groupId, updates });

    const client = await connectToMongoDB();
    const collection = client.db().collection('groups');
    
    // Find the group
    const group = await collection.findOne({ id: groupId });
    
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }
    
    // Update the group with the new metadata
    const updatedGroup = {
      ...group,
      ...updates,
      updatedAt: new Date().toISOString(),
      mongodb: {
        ...group.mongodb,
        lastUpdated: new Date().toISOString()
      }
    };
    
    // Update in MongoDB
    const result = await collection.updateOne(
      { id: groupId },
      { $set: updatedGroup }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update group metadata in MongoDB' },
        { status: 500 }
      );
    }

    console.log('✅ Group metadata updated successfully in MongoDB:', groupId);
    return NextResponse.json({
      success: true,
      metadataHash: updatedGroup.mongodb.documentId,
    });
  } catch (error) {
    console.error('❌ Error updating group metadata in MongoDB:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}