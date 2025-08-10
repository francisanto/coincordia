import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('📊 Admin: Fetching all users from database')
    
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`✅ Admin: Found ${users.length} users`)

    return NextResponse.json({
      success: true,
      users,
      count: users.length
    })
  } catch (error) {
    console.error('❌ Admin: Error fetching users:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { walletAddress, nickname } = await request.json()
    
    if (!walletAddress) {
      return NextResponse.json({ 
        success: false,
        error: 'Wallet address is required' 
      }, { status: 400 })
    }

    console.log('📝 Admin: Creating new user:', walletAddress)

    const user = await prisma.user.create({
      data: {
        walletAddress,
        nickname: nickname || null
      }
    })

    console.log('✅ Admin: User created successfully:', user.id)

    return NextResponse.json({
      success: true,
      user
    })
  } catch (error) {
    console.error('❌ Admin: Error creating user:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}