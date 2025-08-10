import { NextResponse } from 'next/server';

// Admin wallet for authorization checks
const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

// MongoDB API endpoint for bucket operations
const MONGODB_API_ENDPOINT = process.env.MONGODB_API_ENDPOINT

export async function POST(request: Request) {
  try {
    console.log('🪣 POST /api/buckets/create - Creating new group bucket')

    const { bucketName, groupId, creatorAddress } = await request.json()

    if (!bucketName || !groupId || !creatorAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: bucketName, groupId, creatorAddress'
      }, { status: 400 })
    }

    // Only admin can create buckets
    if (creatorAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized: Only admin can create buckets' 
      }, { status: 403 })
    }

    // Create the bucket for the group using MongoDB API
    console.log('🪣 Creating bucket:', bucketName, 'for creator:', creatorAddress)

    // Prepare bucket metadata
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

    // Call MongoDB API to create bucket
    const response = await fetch(`${MONGODB_API_ENDPOINT}/buckets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bucketMetadata),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ MongoDB API error creating bucket:', errorData)
      throw new Error(`Failed to create bucket: ${errorData.error || response.statusText}`)
    }

    const bucketData = await response.json()
    console.log('✅ Bucket created successfully:', bucketName)

    return NextResponse.json({
      success: true,
      bucketName,
      bucketId: bucketData.bucketId || bucketData._id,
      groupId,
      creator: creatorAddress,
    })

  } catch (error) {
    console.error('❌ Error creating group bucket with MongoDB:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create group bucket',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}