import { NextResponse } from 'next/server'
import { arweaveService } from '@/lib/arweave-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')
    const userAddress = searchParams.get('userAddress')

    console.log('📥 Arweave status check request:', { transactionId, userAddress })

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address required' },
        { status: 400 }
      )
    }

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID required' },
        { status: 400 }
      )
    }

    // In a real implementation, this would check the actual status on Arweave
    // For demo purposes, we'll simulate a status check
    // Randomly determine if the transaction is confirmed or still pending
    const isConfirmed = Math.random() > 0.3 // 70% chance of being confirmed
    
    if (isConfirmed) {
      return NextResponse.json({
        success: true,
        status: 'confirmed',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        success: true,
        status: 'pending',
        timestamp: new Date().toISOString()
      })
    }

  } catch (error) {
    console.error('❌ Error in Arweave status check API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', status: 'failed' },
      { status: 500 }
    )
  }
}