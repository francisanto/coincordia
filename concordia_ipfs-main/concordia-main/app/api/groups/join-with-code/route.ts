
import { NextRequest, NextResponse } from 'next/server'
import { walletStorageService } from '@/lib/wallet-storage-service'

export async function POST(request: NextRequest) {
  try {
    console.log('🤝 POST /api/groups/join-with-code - Joining group with code')

    const { groupCode, userAddress, nickname } = await request.json()

    if (!groupCode || !userAddress || !nickname) {
      return NextResponse.json({
        error: 'Missing required fields: groupCode, userAddress, nickname'
      }, { status: 400 })
    }

    // Validate inputs
    if (!/^[A-Z0-9]{6}$/.test(groupCode.toUpperCase())) {
      return NextResponse.json({
        error: 'Invalid group code format (must be 6 characters)'
      }, { status: 400 })
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return NextResponse.json({
        error: 'Invalid wallet address format'
      }, { status: 400 })
    }

    if (nickname.length < 1 || nickname.length > 50) {
      return NextResponse.json({
        error: 'Nickname must be between 1 and 50 characters'
      }, { status: 400 })
    }

    // Initialize storage service
    await walletStorageService.initializeStorage()

    // Join group
    const result = await walletStorageService.joinGroup(
      groupCode.toUpperCase(), 
      userAddress, 
      nickname
    )

    if (!result.success) {
      return NextResponse.json({
        error: result.error || 'Failed to join group'
      }, { status: 400 })
    }

    console.log('✅ Successfully joined group:', result.groupId)

    return NextResponse.json({
      success: true,
      groupId: result.groupId,
      message: 'Successfully joined group'
    })

  } catch (error) {
    console.error('❌ Error joining group with code:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to join group'
    }, { status: 500 })
  }
}
