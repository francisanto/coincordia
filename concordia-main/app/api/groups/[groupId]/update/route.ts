import { NextRequest, NextResponse } from 'next/server';
import { GreenfieldService } from '@/lib/greenfield-service';

const greenfieldService = new GreenfieldService();

export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const { updates } = await request.json();

    console.log('🔄 Updating group metadata in Greenfield:', { groupId, updates });

    const result = await greenfieldService.updateGroupMetadata(groupId, updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update group metadata' },
        { status: 500 }
      );
    }

    console.log('✅ Group metadata updated successfully:', groupId);
    return NextResponse.json({
      success: true,
      metadataHash: result.metadataHash,
    });
  } catch (error) {
    console.error('❌ Error updating group metadata:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 