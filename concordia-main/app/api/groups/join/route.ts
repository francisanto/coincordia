import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    console.log('📥 GET /api/groups/join - Joining group by invite code')
    
    // Get invite code and user address from query parameters
    const url = new URL(request.url)
    const inviteCode = url.searchParams.get('invite_code')
    const userAddress = url.searchParams.get('address')?.toLowerCase()
    
    if (!inviteCode || !userAddress) {
      return NextResponse.json({
        success: false,
        error: "Invite code and user address are required"
      }, { status: 400 })
    }
    
    console.log('🔍 Looking for group with invite code:', inviteCode)
    
    // Join group using MongoDB API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    const response = await fetch(`${apiUrl}/groups/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inviteCode,
        userAddress
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({
        success: false,
        error: errorData.error || `Failed to join group: ${response.statusText}`
      }, { status: response.status })
    }
    
    const result = await response.json()
    
    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || "Failed to join group"
      }, { status: 400 })
    }

    console.log('✅ User added to group successfully:', result.data?.groupId)

    return NextResponse.json({
      success: true,
      message: "Successfully joined the group",
      group: result.data
    })
  } catch (error) {
    console.error("❌ Error joining group:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      success: false,
      error: "Failed to join group",
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}