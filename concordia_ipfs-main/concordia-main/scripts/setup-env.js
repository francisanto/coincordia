#!/usr/bin/env node

/**
 * Environment Variables Setup Script
 * 
 * This script ensures all required environment variables are set with default values
 * if not provided. It's used during the Docker build process.
 */

const fs = require('fs');
const path = require('path');

// Define default environment variables
const defaultEnvVars = {
  // Frontend variables
  NEXT_PUBLIC_CONTRACT_ADDRESS: '0xe93ECeA7f56719e60cb03fc1608A5830793D95FF',
  NEXT_PUBLIC_NETWORK: 'opBNB Testnet',
  NEXT_PUBLIC_RPC_URL: 'https://opbnb-testnet-rpc.bnbchain.org',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://coincordia-production.up.railway.app',
  NEXT_PUBLIC_CHAIN_ID: '5611',
  
  // Backend variables
  PORT: process.env.PORT || '3002',
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // Contract variables
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0xe93ECeA7f56719e60cb03fc1608A5830793D95FF',
  RPC_URL: process.env.RPC_URL || 'https://opbnb-testnet-rpc.bnbchain.org',
  NETWORK: 'opBNB Testnet',
  CHAIN_ID: '5611',
  
  // Database configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://coincordia:coincordiasolly@your_cluster.mongodb.net/test?retryWrites=true&w=majority',
  
  // Admin configuration
  ADMIN_ADDRESS: process.env.ADMIN_ADDRESS || '0xdA13e8F82C83d14E7aa639354054B7f914cA0998',
  ADMIN_API_KEY: process.env.ADMIN_API_KEY || '80378e51250f63ba0746e03add2019001106874edaf28dd6a529a0ae394a94f1',
  
  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://coincordia-fronted-production.up.railway.app',
  
  // Optional variables with fallbacks
  PRIVATE_KEY: process.env.PRIVATE_KEY || '87117ab7b5bedc4ff6487fde37c54b025ba0478f64a8e167bfde4e7b827d09d4',
};

// Path to .env.production file
const envFilePath = path.join(process.cwd(), '.env.production');

// Check if .env.production exists
if (!fs.existsSync(envFilePath)) {
  console.log('Creating .env.production file with default values...');
  
  // Create .env.production content
  const envContent = Object.entries(defaultEnvVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  // Write to .env.production file
  fs.writeFileSync(envFilePath, envContent);
  console.log('.env.production file created successfully!');
} else {
  console.log('.env.production file already exists. Checking for missing variables...');
  
  // Read existing .env.production file
  const existingEnvContent = fs.readFileSync(envFilePath, 'utf8');
  const existingEnvVars = {};
  
  // Parse existing environment variables
  existingEnvContent.split('\n').forEach(line => {
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        existingEnvVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  // Check for missing variables
  let updated = false;
  const updatedEnvContent = existingEnvContent.split('\n');
  
  Object.entries(defaultEnvVars).forEach(([key, value]) => {
    if (!existingEnvVars[key]) {
      updatedEnvContent.push(`${key}=${value}`);
      updated = true;
      console.log(`Added missing variable: ${key}`);
    }
  });
  
  // Write updated content if needed
  if (updated) {
    fs.writeFileSync(envFilePath, updatedEnvContent.join('\n'));
    console.log('.env.production file updated with missing variables!');
  } else {
    console.log('All required variables are already set in .env.production.');
  }
}

console.log('Environment setup completed!');