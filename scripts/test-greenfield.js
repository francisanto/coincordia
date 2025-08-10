#!/usr/bin/env node

const { Client } = require('@bnb-chain/greenfield-js-sdk');

async function testGreenfield() {
  console.log('🔍 Testing BNB Greenfield Connection...\n');
  
  try {
    // Test configuration
    const config = {
      endpoint: "https://gnfd-testnet-sp1.bnbchain.org",
      chainId: 5600,
      bucketName: "concordia-data",
    };
    
    console.log('📋 Configuration:');
    console.log('- Endpoint:', config.endpoint);
    console.log('- Chain ID:', config.chainId);
    console.log('- Bucket:', config.bucketName);
    console.log('');
    
    // Initialize client
    console.log('🔗 Initializing Greenfield client...');
    const client = Client.create(config.endpoint, String(config.chainId));
    console.log('✅ Greenfield client initialized');
    
    // Test listing objects
    console.log('\n📥 Testing bucket access...');
    try {
      const listObjectsResponse = await client.object.listObjects({
        bucketName: config.bucketName,
        prefix: "groups/",
        maxKeys: 10,
      });
      
      console.log('✅ Bucket access successful');
      console.log('📊 Objects found:', listObjectsResponse.objects?.length || 0);
      
      if (listObjectsResponse.objects && listObjectsResponse.objects.length > 0) {
        console.log('📋 Existing objects:');
        listObjectsResponse.objects.forEach((obj, index) => {
          console.log(`  ${index + 1}. ${obj.objectName}`);
        });
      } else {
        console.log('📭 No objects found in bucket');
      }
      
    } catch (bucketError) {
      console.log('❌ Bucket access failed:', bucketError.message);
      
      if (bucketError.message.includes('bucket not found')) {
        console.log('\n💡 Solution: The bucket does not exist or you don\'t have access');
        console.log('   - Check your bucket ID: 0x000000000000000000000000000000000000000000000000000000000000566f');
        console.log('   - Make sure the bucket exists in your Greenfield account');
      } else if (bucketError.message.includes('permission')) {
        console.log('\n💡 Solution: Permission denied - check your account access');
      } else if (bucketError.message.includes('network')) {
        console.log('\n💡 Solution: Network connectivity issue');
      }
    }
    
    // Test creating a simple object
    console.log('\n📤 Testing object creation...');
    try {
      const testObjectName = `test/test_${Date.now()}.json`;
      const testData = {
        test: true,
        timestamp: new Date().toISOString(),
        message: "Greenfield test object"
      };
      
      console.log('📝 Creating test object:', testObjectName);
      
      // Create object with proper parameters
      const createObjectTx = await client.object.createObject({
        bucketName: config.bucketName,
        objectName: testObjectName,
        creator: "0xdA13e8F82C83d14E7aa639354054B7f914cA0998", // Your account
        visibility: "VISIBILITY_TYPE_PUBLIC_READ",
        contentType: "application/json",
        redundancyType: "REDUNDANCY_EC_TYPE",
        payload: Buffer.from(JSON.stringify(testData)),
        tags: [], // Add empty tags array
      });
      
      console.log('✅ Test object created successfully!');
      console.log('🔗 Transaction hash:', createObjectTx.transactionHash);
      
    } catch (createError) {
      console.log('❌ Object creation failed:', createError.message);
      
      if (createError.message.includes('insufficient funds')) {
        console.log('\n💡 Solution: Add BNB to your Greenfield account');
      } else if (createError.message.includes('permission')) {
        console.log('\n💡 Solution: Check account permissions');
      } else if (createError.message.includes('bucket')) {
        console.log('\n💡 Solution: Bucket access issue');
      } else {
        console.log('\n💡 This might be a temporary SDK issue. The bucket access is working.');
      }
    }
    
  } catch (error) {
    console.error('❌ Greenfield test failed:', error.message);
    
    if (error.message.includes('network')) {
      console.log('\n💡 Solution: Check internet connection and Greenfield endpoint');
    } else if (error.message.includes('SDK')) {
      console.log('\n💡 Solution: Greenfield SDK issue - check version');
    }
  }
}

// Run the test
testGreenfield().catch(console.error); 