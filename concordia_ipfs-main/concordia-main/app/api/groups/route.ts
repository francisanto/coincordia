
import { NextRequest, NextResponse } from 'next/server'

// In-memory storage for groups (replace with database in production)
const groups: Record<string, any> = {}
const accessLogs: Array<{ userAddress: string; action: string; groupId: string; timestamp: string }> = []

// Admin wallet address
const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

// Security middleware
function validateUserAddress(userAddress: string): boolean {
  if (!userAddress || typeof userAddress !== 'string') {
    return false
  }
  // Basic Ethereum address validation
  return /^0x[a-fA-F0-9]{40}$/.test(userAddress)
}

function hasReadAccess(group: any, userAddress: string): boolean {
  // Admin has full access
  if (userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()) {
    return true
  }

  // Group creator has access
  if (group.creator?.toLowerCase() === userAddress.toLowerCase()) {
    return true
  }

  // Group members have access
  if (group.members?.some((member: any) => 
    member.address?.toLowerCase() === userAddress.toLowerCase()
  )) {
    return true
  }

  return false
}

function hasWriteAccess(group: any, userAddress: string): boolean {
  // Admin has full access
  if (userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()) {
    return true
  }

  // Only group creator can modify
  return group.creator?.toLowerCase() === userAddress.toLowerCase()
}

function logAccess(userAddress: string, action: string, groupId: string): void {
  accessLogs.push({
    userAddress,
    action,
    groupId,
    timestamp: new Date().toISOString()
  })
  
  // Keep only last 1000 logs
  if (accessLogs.length > 1000) {
    accessLogs.splice(0, accessLogs.length - 1000)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userAddress = request.headers.get('X-User-Address')
    
    if (!userAddress || !validateUserAddress(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid or missing user address' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...groupData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Group ID is required' },
        { status: 400 }
      )
    }

    // Check if group exists and user has write access
    if (groups[id] && !hasWriteAccess(groups[id], userAddress)) {
      logAccess(userAddress, 'UNAUTHORIZED_WRITE', id)
      return NextResponse.json(
        { error: 'Access denied: You cannot modify this group' },
        { status: 403 }
      )
    }

    // Store the group
    groups[id] = {
      ...groupData,
      id,
      createdAt: groups[id]?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastModifiedBy: userAddress
    }

    logAccess(userAddress, 'WRITE', id)
    console.log('✅ Group saved:', id, 'by:', userAddress)
    return NextResponse.json({ success: true, id })

  } catch (error) {
    console.error('❌ Error saving group:', error)
    return NextResponse.json(
      { error: 'Failed to save group' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userAddress = request.headers.get('X-User-Address')
    const url = new URL(request.url)
    const walletParam = url.searchParams.get('user')

    // For public endpoints (like health checks), allow without authentication
    if (!userAddress && !walletParam) {
      return NextResponse.json(Object.values(groups).map(group => ({
        id: group.id,
        name: group.name,
        memberCount: group.members?.length || 0,
        isPublic: true
      })))
    }

    if (!userAddress || !validateUserAddress(userAddress)) {
      return NextResponse.json(
        { error: 'Invalid or missing user address' },
        { status: 401 }
      )
    }

    if (walletParam) {
      // Return groups for specific user
      const userGroups = Object.values(groups).filter(group => 
        hasReadAccess(group, userAddress) && (
          group.creator?.toLowerCase() === walletParam.toLowerCase() ||
          group.members?.some((member: any) => 
            member.address?.toLowerCase() === walletParam.toLowerCase()
          )
        )
      )
      
      logAccess(userAddress, 'READ_USER_GROUPS', walletParam)
      return NextResponse.json(userGroups)
    }

    // Return all groups user has access to
    const accessibleGroups = Object.values(groups).filter(group => 
      hasReadAccess(group, userAddress)
    )

    logAccess(userAddress, 'READ_ALL', 'ALL')
    return NextResponse.json(accessibleGroups)

  } catch (error) {
    console.error('❌ Error loading groups:', error)
    return NextResponse.json(
      { error: 'Failed to load groups' },
      { status: 500 }
    )
  }
}
