import { NextResponse } from 'next/server'
import { Client } from '@bnb-chain/greenfield-js-sdk'

const GREENFIELD_CONFIG = {
  endpoint: process.env.GREENFIELD_ENDPOINT || "https://gnfd-testnet-sp1.bnbchain.org",
  chainId: process.env.GREENFIELD_CHAIN_ID || 5600,
  bucketName: process.env.GREENFIELD_BUCKET || "concordia-data",
}

let greenfieldClient: any = null

async function initGreenfield() {
  if (!greenfieldClient) {
    try {
      greenfieldClient = Client.create(GREENFIELD_CONFIG.endpoint, String(GREENFIELD_CONFIG.chainId))
      console.log('✅ Greenfield client initialized')
    } catch (error) {
      console.error('❌ Failed to initialize Greenfield client:', error)
      throw error
    }
  }
  return greenfieldClient
}

export async function GET(request: Request) {
  try {
    console.log('📥 GET /api/groups/join - Joining group by invite code')
    
    const client = await initGreenfield()
    
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
    
    // List all objects in the groups folder
    const listObjectsResponse = await client.object.listObjects({
      bucketName: GREENFIELD_CONFIG.bucketName,
      prefix: "groups/",
      maxKeys: 1000,
    })

    if (!listObjectsResponse.objects || listObjectsResponse.objects.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No groups found"
      }, { status: 404 })
    }

    // Find the group with the matching invite code
    let targetGroup = null
    for (const object of listObjectsResponse.objects) {
      try {
        const objectData = await client.object.downloadFile({
          bucketName: GREENFIELD_CONFIG.bucketName,
          objectName: object.objectName,
        })
        const groupData = JSON.parse(objectData.toString())
        
        if (groupData.inviteCode === inviteCode) {
          targetGroup = groupData
          break
        }
      } catch (error) {
        console.error(`❌ Error fetching group ${object.objectName}:`, error instanceof Error ? error.message : error)
      }
    }

    if (!targetGroup) {
      return NextResponse.json({
        success: false,
        error: "Invalid invite code"
      }, { status: 404 })
    }

    // Check if user is already a member
    const isAlreadyMember = targetGroup.members.some((member: any) => 
      member.address?.toLowerCase() === userAddress
    )

    if (isAlreadyMember) {
      return NextResponse.json({
        success: false,
        error: "You are already a member of this group"
      }, { status: 400 })
    }

    // Add user to the group
    targetGroup.members.push({
      address: userAddress,
      nickname: "Member",
      contributed: 0,
      auraPoints: 0,
      status: "active",
      role: "member",
      joinedAt: new Date().toISOString()
    })

    targetGroup.updatedAt = new Date().toISOString()

    // Update the group in Greenfield
    const objectName = `groups/group_${targetGroup.groupId}.json`
    
    // Store updated group in BNB Greenfield
    await client.object.createObject({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
      creator: process.env.GREENFIELD_ACCOUNT_ADDRESS || "0x0000000000000000000000000000000000000000",
      visibility: "VISIBILITY_TYPE_PUBLIC_READ",
      contentType: "application/json",
      redundancyType: "REDUNDANCY_EC_TYPE",
      payload: Buffer.from(JSON.stringify(targetGroup)),
    })

    console.log('✅ User added to group successfully:', targetGroup.groupId)

    return NextResponse.json({
      success: true,
      message: "Successfully joined the group",
      group: {
        id: targetGroup.groupId,
        name: targetGroup.name
      }
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