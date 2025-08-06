import { NextResponse } from 'next/server';
import { Client } from '@bnb-chain/greenfield-js-sdk';

const GREENFIELD_CONFIG = {
  endpoint: process.env.GREENFIELD_ENDPOINT || 'https://gnfd-testnet-sp1.bnbchain.org',
  chainId: parseInt(process.env.GREENFIELD_CHAIN_ID || '5600'),
  bucketName: process.env.GREENFIELD_BUCKET || '0x000000000000000000000000000000000000000000000000000000000000566f',
}

const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

let greenfieldClient: any = null

async function initGreenfield() {
  if (!greenfieldClient) {
    try {
      greenfieldClient = Client.create(GREENFIELD_CONFIG.endpoint, String(GREENFIELD_CONFIG.chainId))
      console.log('✅ Greenfield client initialized for bucket creation')
    } catch (error) {
      console.error('❌ Failed to initialize Greenfield client:', error)
      throw error
    }
  }
  return greenfieldClient
}

export async function POST(request: Request) {
  try {
    console.log('🪣 POST /api/buckets/create - Creating new group bucket')

    const { bucketName, groupId, creatorAddress } = await request.json()

    if (!bucketName || !groupId || !creatorAddress) {
      return NextResponse.json({
        error: 'Missing required fields: bucketName, groupId, creatorAddress'
      }, { status: 400 })
    }

    // Only admin can create buckets
    if (creatorAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
      return NextResponse.json({ error: 'Unauthorized: Only admin can create buckets' }, { status: 403 })
    }

    const client = await initGreenfield()

    // Create the bucket for the group
    console.log('🪣 Creating bucket:', bucketName, 'for creator:', creatorAddress)

    const createBucketTx = await client.bucket.createBucket({
      bucketName: bucketName,
      creator: process.env.GREENFIELD_ACCOUNT_ADDRESS || creatorAddress,
      visibility: 'VISIBILITY_TYPE_PRIVATE', // Private bucket, access controlled by permissions
      paymentAddress: process.env.GREENFIELD_ACCOUNT_ADDRESS || creatorAddress,
      primarySpAddress: process.env.GREENFIELD_SP_ADDRESS,
      chargedReadQuota: '0',
    })

    console.log('✅ Bucket created successfully:', bucketName)
    console.log('🔗 Transaction hash:', createBucketTx.transactionHash)

    // Set permissions for the bucket
    // Creator gets full access, members get read + add access
    try {
      const putPolicyTx = await client.bucket.putBucketPolicy({
        bucketName: bucketName,
        principal: creatorAddress,
        statements: [
          {
            effect: 'EFFECT_ALLOW',
            actions: ['ACTION_TYPE_ALL'], // Creator has full access
            resources: [`grn:b::${bucketName}/*`],
          },
        ],
      })

      console.log('✅ Bucket permissions set for creator:', creatorAddress)
    } catch (permError) {
      console.warn('⚠️ Failed to set bucket permissions:', permError)
      // Don't fail the bucket creation if permissions fail
    }

    // Store bucket metadata in admin bucket
    const bucketMetadata = {
      bucketName,
      groupId,
      creator: creatorAddress,
      createdAt: new Date().toISOString(),
      permissions: {
        creator: creatorAddress,
        members: [],
      },
    }

    try {
      await client.object.createObject({
        bucketName: GREENFIELD_CONFIG.bucketName, // Admin bucket
        objectName: `buckets/${groupId}/metadata.json`,
        creator: process.env.GREENFIELD_ACCOUNT_ADDRESS,
        visibility: 'VISIBILITY_TYPE_PRIVATE',
        contentType: 'application/json',
        redundancyType: 'REDUNDANCY_EC_TYPE',
        payload: Buffer.from(JSON.stringify(bucketMetadata, null, 2)),
        tags: [],
      })

      console.log('✅ Bucket metadata stored in admin bucket')
    } catch (metadataError) {
      console.warn('⚠️ Failed to store bucket metadata:', metadataError)
    }

    return NextResponse.json({
      success: true,
      bucketName,
      bucketId: createBucketTx.transactionHash,
      transactionHash: createBucketTx.transactionHash,
      groupId,
      creator: creatorAddress,
    })

  } catch (error) {
    console.error('❌ Error creating group bucket:', error)
    return NextResponse.json({
      error: 'Failed to create group bucket',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}