#!/usr/bin/env node

const https = require('https');

console.log('🔍 Testing Backend Service...\n');

function testUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log(`✅ ${url} - Status: ${res.statusCode}`);
          console.log(`   Response: ${JSON.stringify(json, null, 2)}`);
        } catch (e) {
          console.log(`✅ ${url} - Status: ${res.statusCode}`);
          console.log(`   Response: ${data.substring(0, 100)}...`);
        }
        resolve();
      });
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${url} - Error: ${err.message}`);
      resolve();
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${url} - Timeout`);
      req.destroy();
      resolve();
    });
  });
}

async function testBackend() {
  const baseUrl = process.argv[2] || 'https://your-backend-service.railway.app';
  
  if (baseUrl === 'https://your-backend-service.railway.app') {
    console.log('❌ Please provide your backend URL:');
    console.log('   node scripts/test-backend.js https://your-backend-service.railway.app');
    console.log('\n📋 To find your backend URL:');
    console.log('   1. Go to Railway Dashboard');
    console.log('   2. Click on your backend service');
    console.log('   3. Copy the URL from the "Domains" section');
    return;
  }
  
  console.log(`Testing backend at: ${baseUrl}\n`);
  
  const endpoints = [
    '/api/health',
    '/api/groups',
    '/'
  ];
  
  for (const endpoint of endpoints) {
    await testUrl(`${baseUrl}${endpoint}`);
    console.log('');
  }
  
  console.log('🎯 Backend Test Complete!');
  console.log('\n📋 If you see errors:');
  console.log('   - Check if backend service is deployed');
  console.log('   - Verify environment variables are set');
  console.log('   - Check Railway logs for errors');
}

testBackend().catch(console.error); 