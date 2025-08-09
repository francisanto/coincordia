
import { NextRequest, NextResponse } from 'next/server'
import { walletStorageService } from '@/lib/wallet-storage-service'

export async function POST(request: NextRequest) {
  try {
    console.log('🔑 POST /api/groups/codes/generate - Generating group code')

    const { groupId, creatorAddress } = await request.json()

    if (!groupId || !creatorAddress) {
      return NextResponse.json({
        error: 'Missing required fields: groupId, creatorAddress'
      }, { status: 400 })
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(creatorAddress)) {
      return NextResponse.json({
        error: 'Invalid wallet address format'
      }, { status: 400 })
    }

    // Initialize storage service
    await walletStorageService.initializeStorage()

    // Generate group code
    const result = await walletStorageService.generateGroupCode(groupId, creatorAddress)

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to generate group code'
      }, { status: 403 })
    }

    console.log('✅ Group code generated successfully:', result.code)

    return NextResponse.json({
      success: true,
      code: result.code
    })

  } catch (error) {
    console.error('❌ Error generating group code:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate group code'
    }, { status: 500 })
  }
}
