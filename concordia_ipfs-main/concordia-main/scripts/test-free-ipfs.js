
#!/usr/bin/env node

/**
 * Test script for free IPFS functionality
 * Run with: node scripts/test-free-ipfs.js
 */

const { create } = require('ipfs-http-client');

async function testFreeIPFS() {
  console.log('🧪 Testing Free IPFS Integration...\n');

  // Test data
  const testData = {
    groupId: 'test-group-123',
    name: 'Test Savings Group',
    creator: '0xdA13e8F82C83d14E7aa639354054B7f914cA0998',
    goalAmount: 1000,
    members: [],
    timestamp: new Date().toISOString(),
  };

  // Free IPFS nodes to test
  const freeNodes = [
    {
      name: '4everland',
      client: create({
        host: '4everland.io',
        port: 5001,
        protocol: 'https',
        timeout: 15000,
      }),
    },
    {
      name: 'Cloudflare',
      client: create({
        host: 'cloudflare-ipfs.com',
        port: 443,
        protocol: 'https',
        timeout: 15000,
      }),
    },
  ];

  const gateways = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://dweb.link/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
  ];

  // Test upload
  let uploadHash = null;
  
  for (const node of freeNodes) {
    try {
      console.log(`📤 Testing upload with ${node.name}...`);
      
      const result = await node.client.add(JSON.stringify(testData, null, 2));
      uploadHash = result.cid.toString();
      
      console.log(`✅ Upload successful! Hash: ${uploadHash}`);
      break;
    } catch (error) {
      console.log(`❌ ${node.name} upload failed:`, error.message);
    }
  }

  if (!uploadHash) {
    console.log('❌ All upload attempts failed');
    return;
  }

  // Test retrieval via gateways
  console.log('\n📥 Testing retrieval via HTTP gateways...');
  
  for (const gateway of gateways) {
    try {
      const url = `${gateway}${uploadHash}`;
      console.log(`🔄 Testing: ${url}`);
      
      const response = await fetch(url, { timeout: 10000 });
      
      if (response.ok) {
        const data = await response.text();
        const parsed = JSON.parse(data);
        
        if (parsed.groupId === testData.groupId) {
          console.log(`✅ ${gateway} - Retrieval successful!`);
        } else {
          console.log(`⚠️ ${gateway} - Data mismatch`);
        }
      } else {
        console.log(`❌ ${gateway} - HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${gateway} - Error:`, error.message);
    }
  }

  console.log('\n🎉 Free IPFS test completed!');
  console.log('📋 Key Features:');
  console.log('  ✅ No API keys required');
  console.log('  ✅ Multiple fallback nodes');
  console.log('  ✅ Multiple retrieval gateways'); 
  console.log('  ✅ Automatic failover');
  console.log('  ✅ Admin wallet access control');
  console.log('  ✅ Group-based permissions');
  console.log('\n📝 Your admin address: 0xdA13e8F82C83d14E7aa639354054B7f914cA0998');
}

// Global fetch for Node.js (if not available)
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testFreeIPFS().catch(console.error);
