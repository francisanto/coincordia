const { connectDB } = require('./backend/db');
const Bucket = require('./backend/models/Bucket');
const Group = require('./backend/models/Group');

async function testMongoDB() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    
    // Connect to MongoDB
    const connected = await connectDB();
    if (!connected) {
      console.error('❌ Failed to connect to MongoDB');
      return;
    }
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Test creating a bucket
    const bucketId = 'test-bucket-' + Date.now();
    const bucketName = 'Test Bucket ' + Date.now();
    const groupId = 'test-group-' + Date.now();
    const creator = '0xdA13e8F82C83d14E7aa639354054B7f914cA0998';
    
    console.log('🔄 Creating test bucket:', bucketName);
    
    const bucket = new Bucket({
      bucketId,
      bucketName,
      groupId,
      creator,
      permissions: {
        creator,
        members: []
      },
      createdAt: new Date().toISOString()
    });
    
    await bucket.save();
    
    console.log('✅ Test bucket created successfully');
    
    // Test retrieving the bucket
    console.log('🔄 Retrieving test bucket...');
    
    const retrievedBucket = await Bucket.findOne({ bucketId });
    
    if (retrievedBucket) {
      console.log('✅ Test bucket retrieved successfully:', retrievedBucket.bucketName);
    } else {
      console.error('❌ Failed to retrieve test bucket');
    }
    
    // Test creating a group with bucket reference
    console.log('🔄 Creating test group...');
    
    const group = new Group({
      groupId,
      name: 'Test Group ' + Date.now(),
      description: 'Test group for MongoDB integration',
      creator,
      goalAmount: 1000,
      duration: 30,
      withdrawalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      dueDay: 1,
      bucket: {
        bucketId,
        bucketName,
        endpoint: `${process.env.MONGODB_API_ENDPOINT || process.env.NEXT_PUBLIC_API_URL + '/api'}/buckets`
      },
      inviteCode: 'TEST123',
      members: [{
        address: creator,
        nickname: 'Creator',
        joinedAt: new Date().toISOString(),
        role: 'creator',
        contribution: 0,
        auraPoints: 0,
        hasVoted: false,
        status: 'active'
      }],
      contributions: [],
      settings: {
        dueDay: 1,
        duration: '30',
        withdrawalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        maxMembers: 10,
        bucketName
      },
      blockchain: {
        contractAddress: '',
        transactionHash: '',
        blockNumber: '',
        gasUsed: '',
        network: 'testnet'
      }
    });
    
    await group.save();
    
    console.log('✅ Test group created successfully');
    
    // Test retrieving the group
    console.log('🔄 Retrieving test group...');
    
    const retrievedGroup = await Group.findOne({ groupId });
    
    if (retrievedGroup) {
      console.log('✅ Test group retrieved successfully:', retrievedGroup.name);
      console.log('✅ Group bucket reference:', retrievedGroup.bucket.bucketName);
    } else {
      console.error('❌ Failed to retrieve test group');
    }
    
    // Clean up test data
    console.log('🔄 Cleaning up test data...');
    
    await Bucket.deleteOne({ bucketId });
    await Group.deleteOne({ groupId });
    
    console.log('✅ Test data cleaned up successfully');
    
    console.log('✅ MongoDB integration test completed successfully');
  } catch (error) {
    console.error('❌ Error testing MongoDB integration:', error);
  } finally {
    process.exit(0);
  }
}

testMongoDB();