import { NextResponse } from 'next/server'

const ADMIN_WALLET = process.env.ADMIN_ADDRESS || '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

export async function GET(
  request: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params
    if (!groupId) {
      console.error('❌ Missing groupId parameter')
      return NextResponse.json({
        success: false,
        error: 'Missing groupId parameter',
      }, { status: 400 })
    }
    
    console.log('📥 GET /api/groups/:groupId - Fetching group from MongoDB:', groupId)
    
    // Get user address from request headers or query parameters
    const url = new URL(request.url)
    const userAddress = url.searchParams.get('address')?.toLowerCase()
    const isAdmin = userAddress === ADMIN_WALLET.toLowerCase() || url.searchParams.get('admin_key') === process.env.ADMIN_API_KEY
    
    console.log('👤 Request from user:', userAddress, 'Admin access:', isAdmin)
    
    // Fetch group from MongoDB API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    
    let groupData = null
    let fetchError = null
    
    try {
      // Add timeout to fetch request to prevent hanging
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(`${apiUrl}/groups/${groupId}`, {
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId))
      
      if (!response.ok) {
        fetchError = `Failed to fetch group: ${response.status} ${response.statusText}`
        console.error(`❌ ${fetchError}`)
      } else {
        try {
          const result = await response.json()
          
          if (!result.success) {
            fetchError = result.error || 'Failed to fetch group'
            console.error(`❌ ${fetchError}`)
          } else {
            groupData = result.data || result.group
            if (!groupData) {
              fetchError = 'Group data is empty'
              console.error(`❌ ${fetchError}`)
            } else {
              console.log('✅ Group loaded successfully:', groupId)
            }
          }
        } catch (parseError) {
          fetchError = `Failed to parse response: ${parseError instanceof Error ? parseError.message : 'Invalid JSON'}`
          console.error(`❌ ${fetchError}`)
        }
      }
    } catch (error) {
      fetchError = error instanceof Error ? 
        (error.name === 'AbortError' ? 'Request timed out' : error.message) : 
        'Unknown error fetching group'
      console.error(`❌ Error fetching group: ${fetchError}`)
    }
    
    if (!groupData) {
      return NextResponse.json({
        success: false,
        error: fetchError || 'Failed to fetch group',
        groupId: groupId,
      }, { status: 404 })
    }
      
      // Check if user has access to this group
      try {
        if (!isAdmin && userAddress) {
          // Safely check if creator exists and matches
          const isCreator = groupData.creator && groupData.creator.toLowerCase() === userAddress
          
          // Safely check if user is a member
          const isMember = Array.isArray(groupData.members) && groupData.members.some((member: any) => 
            member && member.address && member.address.toLowerCase() === userAddress
          )
          
          if (!isCreator && !isMember) {
            console.log('🔒 Access denied for user:', userAddress, 'to group:', groupId)
            return NextResponse.json({
              success: false,
              error: `Access denied to group: ${groupId}`,
              details: 'You are not a member of this group',
              groupId: groupId,
            }, { status: 403 })
          }
          
          console.log('✅ Access granted for user:', userAddress, 'to group:', groupId)
        } else if (isAdmin) {
          console.log('👑 Admin access granted to group:', groupId)
        } else {
          // If no user address and not admin, deny access
          console.log('⚠️ No user address or admin key provided - access denied')
          return NextResponse.json({
            success: false,
            error: `Access denied to group: ${groupId}`,
            details: 'Authentication required',
            groupId: groupId,
          }, { status: 401 })
        }
      } catch (accessError) {
        console.error(`❌ Error checking access permissions: ${accessError instanceof Error ? accessError.message : accessError}`)
        return NextResponse.json({
          success: false,
          error: 'Error checking access permissions',
          details: accessError instanceof Error ? accessError.message : 'Unknown error',
          groupId: groupId,
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        metadata: groupData,
        groupId: groupId
      })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Error fetching group ${params.groupId || 'unknown'}:`, errorMessage)
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      groupId: params.groupId || 'unknown',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}