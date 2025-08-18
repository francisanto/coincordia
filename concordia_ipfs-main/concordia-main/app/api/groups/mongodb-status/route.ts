import { NextResponse } from 'next/server'
import { GroupMetadata } from '@/lib/types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const userAddress = searchParams.get('userAddress')

    console.log('📥 MongoDB status check request:', { documentId, userAddress })

    if (!userAddress) {
      return NextResponse.json(
        { success: false, error: 'User address required' },
        { status: 400 }
      )
    }

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID required' },
        { status: 400 }
      )
    }

    // In a real implementation, this would check the actual status in MongoDB
    // For demo purposes, we'll simulate a status check
    // Randomly determine if the document is confirmed or still pending
    const isConfirmed = Math.random() > 0.3 // 70% chance of being confirmed
    
    return NextResponse.json({
      success: true,
      status: isConfirmed ? 'confirmed' : 'pending',
      documentId,
      confirmations: isConfirmed ? Math.floor(Math.random() * 10) + 1 : 0,
      viewUrl: isConfirmed 
        ? `/api/groups/view?id=${documentId}`
        : null
    })

  } catch (error) {
    console.error('❌ Error in Arweave status check API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error', status: 'failed' },
      { status: 500 }
    )
  }
}