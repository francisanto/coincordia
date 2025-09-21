import { NextRequest, NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/mongodb';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    console.log('🗑️ Deleting group data from MongoDB:', groupId);

    const client = await connectToMongoDB();
    const collection = client.db().collection('groups');
    
    // Delete the group
    const result = await collection.deleteOne({ id: groupId });
    
    // Also delete any contributions for this group
    const contributionsCollection = client.db().collection('contributions');
    await contributionsCollection.deleteMany({ groupId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    console.log('✅ Group data deleted successfully from MongoDB:', groupId);
    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting group data from MongoDB:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}