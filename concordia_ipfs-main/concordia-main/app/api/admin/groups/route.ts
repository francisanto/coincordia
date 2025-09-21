import { NextResponse } from 'next/server'
import { connectToMongoDB } from '@/lib/mongodb'

const ADMIN_CONFIG = {
  adminAddress: process.env.ADMIN_ADDRESS || "0x0000000000000000000000000000000000000000", // Admin wallet address
}

export async function GET(request: Request) {
  try {
    console.log('👑 GET /api/admin/groups - Admin access to all groups')
    
    const url = new URL(request.url)
    
    // Check if this is an admin check request
    const isAdminCheck = url.searchParams.get('check_admin') === 'true'
    const checkAddress = url.searchParams.get('address')
    
    if (isAdminCheck && checkAddress) {
      console.log('🔍 Checking if address is admin:', checkAddress)
      const isAdmin = checkAddress.toLowerCase() === ADMIN_CONFIG.adminAddress.toLowerCase()
      
      if (isAdmin) {
        console.log('✅ Admin address verified')
        return NextResponse.json({
          isAdmin: true,
          adminApiKey: process.env.ADMIN_API_KEY
        })
      } else {
        console.log('❌ Not an admin address')
        return NextResponse.json({ isAdmin: false })
      }
    }
    
    // For regular admin data requests, verify admin API key
    const adminKey = url.searchParams.get('admin_key')
    
    if (adminKey !== process.env.ADMIN_API_KEY) {
      console.error('🔒 Unauthorized admin access attempt')
      return NextResponse.json({
        error: "Unauthorized. Admin API key required.",
      }, { status: 401 })
    }
    
    console.log('✅ Admin API key verified')
    
    // Connect to MongoDB and fetch all groups
    const client = await connectToMongoDB()
    const collection = client.db().collection('groups')
    
    // Get all groups from MongoDB
    const groups = await collection.find({}).toArray()
    
    console.log('📊 Found groups in MongoDB:', groups.length)
    
    if (groups.length === 0) {
      console.log('📭 No groups found in MongoDB')
      return NextResponse.json({
        success: true,
        groups: []
      })
    }

    console.log('✅ Successfully loaded all groups for admin:', groups.length)
    
    // Return all groups with admin statistics
    const stats = {
      totalGroups: groups.length,
      totalMembers: groups.reduce((acc, group) => acc + (group.members?.length || 0), 0),
      totalContributions: groups.reduce((acc, group) => acc + (group.currentAmount || 0), 0),
      activeGroups: groups.filter(group => group.isActive).length,
      inactiveGroups: groups.filter(group => !group.isActive).length,
    }
    
    return NextResponse.json({
      success: true,
      groups,
      stats,
    })
  } catch (error) {
    console.error("❌ Error retrieving groups from MongoDB:", error instanceof Error ? error.message : error)
    return NextResponse.json({
      error: "Failed to retrieve groups from MongoDB",
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}