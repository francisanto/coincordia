#!/usr/bin/env node

/**
 * Health Check Script
 * 
 * This script checks if the Concordia IPFS application is running properly
 * by making a request to the health endpoint.
 */

const http = require('http');
const https = require('https');

// Default URL to check
const DEFAULT_URL = 'http://localhost:5000/api/health';

// Get URL from command line arguments or use default
const url = process.argv[2] || DEFAULT_URL;

console.log(`Checking health of ${url}...`);

// Parse the URL to determine if it's HTTP or HTTPS
const parsedUrl = new URL(url);
const client = parsedUrl.protocol === 'https:' ? https : http;

// Make the request
const req = client.get(url, (res) => {
  let data = '';
  
  // A chunk of data has been received
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // The whole response has been received
  res.on('end', () => {
    if (res.statusCode === 200) {
      try {
        const healthData = JSON.parse(data);
        console.log('✅ Application is healthy!');
        console.log('Status:', healthData.status);
        console.log('Environment:', healthData.environment);
        console.log('Version:', healthData.version);
        console.log('Timestamp:', healthData.timestamp);
        process.exit(0);
      } catch (e) {
        console.error('❌ Error parsing health check response:', e.message);
        process.exit(1);
      }
    } else {
      console.error(`❌ Health check failed with status code: ${res.statusCode}`);
      console.error('Response:', data);
      process.exit(1);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('❌ Health check request failed:', error.message);
  process.exit(1);
});

// Set a timeout for the request
req.setTimeout(5000, () => {
  console.error('❌ Health check request timed out after 5 seconds');
  req.destroy();
  process.exit(1);
});