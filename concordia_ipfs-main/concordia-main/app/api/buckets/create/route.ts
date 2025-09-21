import { NextResponse } from 'next/server';
import { connectToMongoDB } from '@/lib/mongodb';

const ADMIN_WALLET = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998'

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

    // Connect to MongoDB
    const client = await connectToMongoDB()
    const collection = client.db().collection('buckets')

    // Create a bucket record in MongoDB
    console.log('🪣 Creating bucket record in MongoDB:', bucketName, 'for creator:', creatorAddress)

    // Store bucket metadata
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
      // Insert the bucket metadata into MongoDB
      const result = await collection.insertOne(bucketMetadata)
      const bucketId = result.insertedId.toString()

      console.log('✅ Bucket metadata stored in MongoDB with ID:', bucketId)

      return NextResponse.json({
        success: true,
        bucketName,
        bucketId,
        groupId,
        creator: creatorAddress,
      })
    } catch (error) {
      console.error('❌ Failed to store bucket metadata:', error)
      throw error
    }

  } catch (error) {
    console.error('❌ Error creating bucket in MongoDB:', error)
    return NextResponse.json({
      error: 'Failed to create bucket in MongoDB',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}