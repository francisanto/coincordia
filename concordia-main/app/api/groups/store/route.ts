import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@bnb-chain/greenfield-js-sdk'
import { prisma } from '@/lib/prisma'

const GREENFIELD_CONFIG = {
  endpoint: process.env.GREENFIELD_ENDPOINT || "https://gnfd-testnet-sp1.bnbchain.org",
  chainId: process.env.GREENFIELD_CHAIN_ID || 5600,
  bucketName: process.env.GREENFIELD_BUCKET || "concordia-data",
}

const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

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

export async function POST(request: NextRequest) {
  try {
    console.log('📤 POST /api/groups/store - Storing group data in BNB Greenfield')

    const { groupId, groupData, userAddress } = await request.json()

    if (!groupId || !groupData || !userAddress) {
      return NextResponse.json({
        error: 'Missing required fields: groupId, groupData, userAddress'
      }, { status: 400 })
    }

    // Check if user is admin or has access to the group
    const isAdmin = userAddress.toLowerCase() === ADMIN_WALLET.toLowerCase()

    if (!isAdmin) {
      // Check if user has write access to the group if not admin
      try {
        const accessResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/groups/${groupId}/access?address=${userAddress}`)
        const accessResult = await accessResponse.json()

        if (!accessResult.canWrite) {
          return NextResponse.json({
            error: 'Access denied: You do not have permission to modify this group'
          }, { status: 403 })
        }
      } catch (accessError) {
        console.warn('⚠️ Could not verify access, proceeding with storage')
      }
    }


    // Check if this is a new group creation or update
    const isNewGroup = !groupData.createdAt || groupData.createdAt === groupData.updatedAt

    if (isNewGroup) {
      // Create new bucket for the group
      console.log('🆕 Creating new group, creating bucket...')

      try {
        const createBucketResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/buckets/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucketName: `concordia-group-${groupId.toLowerCase()}`,
            groupId,
            creatorAddress: userAddress,
          }),
        })

        if (!createBucketResponse.ok) {
          console.error('❌ Failed to create bucket for group')
          // Continue with storage even if bucket creation fails
        } else {
          console.log('✅ Bucket created successfully for group')
        }
      } catch (bucketError) {
        console.error('❌ Error creating bucket:', bucketError)
        // Continue with storage
      }
    } else {
      // Check access permissions for existing group
      try {
        const accessResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/groups/${groupId}/access?address=${userAddress}`)
        const accessResult = await accessResponse.json()

        if (!accessResult.canWrite) {
          return NextResponse.json({
            error: 'Access denied: You cannot modify this group'
          }, { status: 403 })
        }
      } catch (accessError) {
        console.warn('⚠️ Could not verify access, proceeding with storage')
      }
    }

    const client = await initGreenfield()
    // Use group-specific bucket
    const groupBucketName = `concordia-group-${groupId.toLowerCase()}`
    const objectName = `groups/${groupId}/data.json`

    // Update group data with proper bucket information
    const updatedGroupData = {
      ...groupData,
      settings: {
        ...groupData.settings,
        bucketName: groupBucketName,
      },
      greenfield: {
        ...groupData.greenfield,
        bucketName: groupBucketName,
      },
    }

    console.log('💾 Storing group data in BNB Greenfield...')

    // Store in group-specific bucket
    const createObjectTx = await client.object.createObject({
      bucketName: groupBucketName,
      objectName: objectName,
      creator: process.env.GREENFIELD_ACCOUNT_ADDRESS || "0x0000000000000000000000000000000000000000",
      visibility: "VISIBILITY_TYPE_PUBLIC_READ",
      contentType: "application/json",
      redundancyType: "REDUNDANCY_EC_TYPE",
      payload: Buffer.from(JSON.stringify(updatedGroupData)),
    })

    console.log('✅ Group stored successfully in BNB Greenfield:', groupId)
    console.log('🔗 Transaction hash:', createObjectTx.transactionHash)

    // Save user data to database for admin tracking
    try {
      console.log('💾 Saving user data to database for admin tracking...')

      const creatorAddress = groupData.creator || groupData.createdBy || userAddress
      if (creatorAddress) {
        // Create or update user in database
        await prisma.user.upsert({
          where: { walletAddress: creatorAddress },
          update: {
            totalAuraPoints: { increment: 10 }, // Give 10 aura points for creating a group
            totalContributed: { increment: groupData.currentAmount || 0 },
            updatedAt: new Date()
          },
          create: {
            walletAddress: creatorAddress,
            nickname: groupData.creatorNickname || 'Creator',
            totalAuraPoints: 10,
            totalContributed: groupData.currentAmount || 0
          }
        })

        // Log admin action
        await prisma.adminLog.create({
          data: {
            action: 'GROUP_CREATED',
            details: {
              groupId,
              creator: creatorAddress,
              groupName: groupData.name,
              amount: groupData.currentAmount
            },
            adminAddress: creatorAddress
          }
        })

        console.log('✅ User data saved to database')
      }
    } catch (dbError) {
      console.warn('⚠️ Database save failed (non-critical):', dbError)
      // Continue even if database save fails - Greenfield storage is the primary
    }

    return NextResponse.json({
      success: true,
      objectName: objectName,
      transactionHash: createObjectTx.transactionHash,
      metadata: updatedGroupData,
    })
  } catch (error) {
    console.error('❌ Error storing group data in BNB Greenfield:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}