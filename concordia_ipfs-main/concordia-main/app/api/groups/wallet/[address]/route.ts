
import { NextRequest, NextResponse } from 'next/server'
import { walletStorageService } from '@/lib/wallet-storage-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    console.log('📥 GET /api/groups/wallet/[address] - Loading groups for wallet:', params.address)

    if (!params.address) {
      return NextResponse.json({
        error: 'Wallet address is required'
      }, { status: 400 })
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(params.address)) {
      return NextResponse.json({
        error: 'Invalid wallet address format'
      }, { status: 400 })
    }

    // Initialize storage service
    await walletStorageService.initializeStorage()

    // Load user groups
    const groups = await walletStorageService.loadUserGroups(params.address)

    console.log('✅ Successfully loaded groups for wallet:', groups.length)

    return NextResponse.json({
      success: true,
      groups: groups,
      count: groups.length
    })

  } catch (error) {
    console.error('❌ Error loading groups for wallet:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load groups',
      groups: []
    }, { status: 500 })
  }
}
