
import { NextRequest, NextResponse } from 'next/server';
import { dataPersistenceService } from '@/lib/data-persistence';

export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { updates } = await request.json();

    console.log('🔄 Updating group metadata:', { groupId, updates });

    // Get current group data
    const currentGroup = await dataPersistenceService.getGroup(groupId);
    if (!currentGroup) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      );
    }

    // Update group with new data
    const updatedGroup = { ...currentGroup, ...updates };
    // Use admin address for saving
    const userAddress = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998';
    const result = await dataPersistenceService.saveGroup(updatedGroup, userAddress);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update group metadata' },
        { status: 500 }
      );
    }

    console.log('✅ Group metadata updated successfully:', groupId);
    return NextResponse.json({
      success: true,
      group: updatedGroup,
    });
  } catch (error) {
    console.error('❌ Error updating group metadata:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
