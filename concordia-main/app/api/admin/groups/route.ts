
import { NextResponse } from 'next/server'

const ADMIN_WALLET = process.env.ADMIN_ADDRESS || '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

export async function GET(request: Request) {
  try {
    console.log('👑 GET /api/admin/groups - Admin access to all groups')
    
    const url = new URL(request.url)
    
    // Check if this is an admin check request
    const isAdminCheck = url.searchParams.get('check_admin') === 'true'
    const checkAddress = url.searchParams.get('address')
    
    if (isAdminCheck && checkAddress) {
      console.log('🔍 Checking if address is admin:', checkAddress)
      const isAdmin = checkAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()
      
      if (isAdmin) {
        console.log('✅ Admin address verified')
        return NextResponse.json({
          success: true,
          isAdmin: true,
          adminApiKey: process.env.ADMIN_API_KEY
        })
      } else {
        console.log('❌ Not an admin address')
        return NextResponse.json({ 
          success: false,
          isAdmin: false 
        })
      }
    }
    
    // For regular admin data requests, verify admin API key
    const adminKey = url.searchParams.get('admin_key')
    
    if (adminKey !== process.env.ADMIN_API_KEY) {
      console.error('🔒 Unauthorized admin access attempt')
      return NextResponse.json({
        success: false,
        error: "Unauthorized. Admin API key required.",
      }, { status: 401 })
    }
    
    console.log('✅ Admin API key verified')
    
    // Fetch all groups from MongoDB API
    console.log('🔍 Fetching all groups from MongoDB API')
    
    const mongoDbApiUrl = process.env.MONGODB_API_ENDPOINT
    const response = await fetch(`${mongoDbApiUrl}/groups`)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const groups = data.groups || []
    
    console.log('📊 Found groups in MongoDB:', groups.length)

    console.log('✅ Successfully loaded all groups for admin:', groups.length)
    
    // Return all groups with admin statistics
    const stats = {
      totalGroups: groups.length,
      totalMembers: groups.reduce((acc: number, group: { members?: any[] }) => acc + (group.members?.length || 0), 0),
      totalContributions: groups.reduce((acc: number, group: { currentAmount?: number }) => acc + (group.currentAmount || 0), 0),
      activeGroups: groups.filter((group: { isActive: boolean }) => group.isActive).length,
      inactiveGroups: groups.filter((group: { isActive: boolean }) => !group.isActive).length,
    }
    
    return NextResponse.json({
      success: true,
      groups,
      stats,
    })
  } catch (error) {
    console.error("❌ Error retrieving groups from MongoDB:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      success: false,
      error: "Failed to retrieve groups from MongoDB",
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}