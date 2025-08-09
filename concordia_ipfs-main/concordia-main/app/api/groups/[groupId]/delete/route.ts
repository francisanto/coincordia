
import { NextRequest, NextResponse } from 'next/server';
import { dataPersistenceService } from '@/lib/data-persistence';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    console.log('🗑️ Deleting group data:', groupId);

    // Extract user address from request or use admin address
    const userAddress = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'; // Admin address as default
    
    // Delete group data using existing persistence service
    const success = await dataPersistenceService.deleteGroup(groupId, userAddress);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete group data' },
        { status: 500 }
      );
    }

    console.log('✅ Group data deleted successfully:', groupId);
    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting group data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
