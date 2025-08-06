import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('📊 Admin: Fetching system statistics')
    
    // Get user count
    const userCount = await prisma.user.count()
    
    // Get total aura points
    const totalAuraPoints = await prisma.user.aggregate({
      _sum: {
        totalAuraPoints: true
      }
    })
    
    // Get total contributed amount
    const totalContributed = await prisma.user.aggregate({
      _sum: {
        totalContributed: true
      }
    })
    
    // Get latest system stats
    const systemStats = await prisma.systemStat.findFirst({
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const stats = {
      totalUsers: userCount,
      totalAuraPoints: totalAuraPoints._sum.totalAuraPoints || 0,
      totalContributed: totalContributed._sum.totalContributed || 0,
      totalGroups: systemStats?.totalGroups || 0,
      totalVolume: systemStats?.totalVolume || 0,
      lastUpdated: systemStats?.updatedAt || new Date()
    }

    console.log('✅ Admin: System statistics:', stats)

    return NextResponse.json({
      success: true,
      stats
    })
  } catch (error) {
    console.error('❌ Admin: Error fetching system stats:', error)
    return NextResponse.json({
      error: 'Failed to fetch system statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { totalGroups, totalUsers, totalVolume } = await request.json()
    
    console.log('📝 Admin: Updating system statistics')

    const systemStats = await prisma.systemStat.create({
      data: {
        totalGroups: totalGroups || 0,
        totalUsers: totalUsers || 0,
        totalVolume: totalVolume || 0
      }
    })

    console.log('✅ Admin: System statistics updated:', systemStats.id)

    return NextResponse.json({
      success: true,
      stats: systemStats
    })
  } catch (error) {
    console.error('❌ Admin: Error updating system stats:', error)
    return NextResponse.json({
      error: 'Failed to update system statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 