
import { NextRequest, NextResponse } from 'next/server'
import { walletStorageService } from '@/lib/wallet-storage-service'

const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

export async function GET(request: NextRequest) {
  try {
    console.log('👑 GET /api/admin/groups - Admin loading all groups')

    const { searchParams } = new URL(request.url)
    const adminAddress = searchParams.get('adminAddress')

    // Verify admin access
    if (!adminAddress || adminAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
      return NextResponse.json({
        error: 'Access denied: Admin privileges required'
      }, { status: 403 })
    }

    // Initialize storage service
    await walletStorageService.initializeStorage()

    // Load all groups (admin access)
    const groups = await walletStorageService.loadAllGroupsAdmin()

    console.log('✅ Admin loaded all groups:', groups.length)

    return NextResponse.json({
      success: true,
      groups: groups,
      count: groups.length,
      statistics: {
        totalGroups: groups.length,
        totalMembers: groups.reduce((total, group) => total + group.members.length, 0),
        totalContributions: groups.reduce((total, group) => 
          total + (group.contributions?.reduce((sum, contrib) => sum + Number(contrib.amount), 0) || 0), 0
        ),
        averageGroupSize: groups.length > 0 ? 
          groups.reduce((total, group) => total + group.members.length, 0) / groups.length : 0
      }
    })

  } catch (error) {
    console.error('❌ Error loading all groups as admin:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load groups',
      groups: []
    }, { status: 500 })
  }
}
