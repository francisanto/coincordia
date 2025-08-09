#!/usr/bin/env node

const https = require('https');

console.log('🔍 Verifying Backend Service...\n');

// Function to check if a URL is accessible
function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      console.log(`✅ ${url} - Status: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log(`❌ ${url} - Error: ${err.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${url} - Timeout`);
      req.destroy();
      resolve(false);
    });
  });
}

// Check common backend endpoints
async function verifyBackend() {
  const baseUrl = process.argv[2] || 'https://your-backend-service.railway.app';
  
  console.log(`Checking backend at: ${baseUrl}\n`);
  
  const endpoints = [
    '/api/health',
    '/api/groups',
    '/'
  ];
  
  for (const endpoint of endpoints) {
    await checkUrl(`${baseUrl}${endpoint}`);
  }
  
  console.log('\n🎯 Backend Verification Complete!');
  console.log('\nIf you see ❌ errors:');
  console.log('1. Make sure your backend service is deployed');
  console.log('2. Check the backend URL is correct');
  console.log('3. Verify environment variables are set');
  console.log('4. Check Railway logs for errors');
}

verifyBackend().catch(console.error); 