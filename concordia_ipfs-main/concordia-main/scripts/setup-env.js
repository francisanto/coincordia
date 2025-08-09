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
  NEXT_PUBLIC_CONTRACT_ADDRESS: '0x31ff87832e0bc5eaee333d1db549829ba0376d45aa23a41e6b12bfe17c969595',
  NEXT_PUBLIC_NETWORK: 'opBNB Testnet',
  NEXT_PUBLIC_RPC_URL: 'https://opbnb-testnet-rpc.bnbchain.org',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  
  // Backend variables
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'production',
  
  // Contract variables
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0x31ff87832e0bc5eaee333d1db549829ba0376d45aa23a41e6b12bfe17c969595',
  RPC_URL: process.env.RPC_URL || 'https://opbnb-testnet-rpc.bnbchain.org',
  
  // Optional variables with fallbacks
  ARWEAVE_KEY: process.env.ARWEAVE_KEY || '{}',
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