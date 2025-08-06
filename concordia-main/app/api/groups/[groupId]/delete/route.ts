import { NextRequest, NextResponse } from 'next/server';
import { GreenfieldService } from '@/lib/greenfield-service';

const greenfieldService = new GreenfieldService();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    console.log('🗑️ Deleting group data from Greenfield:', groupId);

    const result = await greenfieldService.deleteGroupData(groupId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete group data' },
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