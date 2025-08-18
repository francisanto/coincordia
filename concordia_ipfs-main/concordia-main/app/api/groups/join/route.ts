
import { NextResponse } from 'next/server'
import { GroupMetadata } from '@/lib/types'

// Simple in-memory storage for group index (in production, use MongoDB)
const groupDocumentIndex: Record<string, string> = {}

export async function POST(request: Request) {
  try {
    const { groupCode, userAddress, nickname } = await request.json()

    console.log('🤝 Join group request:', { groupCode, userAddress, nickname })

    if (!groupCode || !userAddress || !nickname) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the MongoDB document ID from the group code
    // In a real implementation, you'd validate the code against your system
    const documentId = groupDocumentIndex[groupCode] || groupCode

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Invalid group code' },
        { status: 404 }
      )
    }

    // Join the group via MongoDB
    // Mock implementation until MongoDB service is fully implemented
    const result = {
      success: true,
      newDocumentId: documentId,
      error: null
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to join group' },
        { status: 500 }
      )
    }

    // Update the group document index if we got a new document ID
    if (result.newDocumentId) {
      groupDocumentIndex[groupCode] = result.newDocumentId
    }

    return NextResponse.json({
      success: true,
      data: {
        documentId: result.newDocumentId || documentId,
        message: 'Successfully joined group'
      }
    })

  } catch (error) {
    console.error('❌ Error in join group API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const groupCode = searchParams.get('code')

    if (!groupCode) {
      return NextResponse.json(
        { success: false, error: 'Group code required' },
        { status: 400 }
      )
    }

    // Get group info from MongoDB
    const documentId = groupDocumentIndex[groupCode] || groupCode
    
    // Mock implementation until MongoDB service is fully implemented
    const result = {
      success: true,
      data: {
        groupId: 'group-' + Math.random().toString(36).substring(2, 8),
        name: 'Sample Group',
        description: 'A sample group from MongoDB',
        members: []
      }
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: 'Group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        groupId: result.data?.groupId,
        name: result.data?.name,
        description: result.data?.description,
        memberCount: result.data?.members?.length || 0,
        documentId
      }
    })

  } catch (error) {
    console.error('❌ Error getting group info:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
