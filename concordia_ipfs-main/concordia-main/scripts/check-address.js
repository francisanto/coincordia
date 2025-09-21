#!/usr/bin/env node

const { ethers } = require('ethers');

// Address to check
const ADDRESS_TO_CHECK = "0xED8e5C546F84442219A5a987EE1D820698528E04";
const RPC_URL = "https://opbnb-testnet-rpc.bnbchain.org";

async function checkAddress() {
  console.log('🔍 Checking Address Information...\n');
  
  try {
    // Connect to opBNB testnet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Connected to opBNB Testnet');
    
    console.log('📋 Address to check:', ADDRESS_TO_CHECK);
    
    // Check 1: Get ETH balance
    console.log('\n📋 Check 1: ETH Balance');
    try {
      const balance = await provider.getBalance(ADDRESS_TO_CHECK);
      console.log('✅ ETH balance:', ethers.formatEther(balance), 'BNB');
    } catch (error) {
      console.log('❌ Could not get ETH balance:', error.message);
    }
    
    // Check 2: Check if it's a contract
    console.log('\n📋 Check 2: Is it a Contract?');
    try {
      const code = await provider.getCode(ADDRESS_TO_CHECK);
      if (code === '0x') {
        console.log('✅ This is a regular wallet address (not a contract)');
      } else {
        console.log('✅ This is a CONTRACT address');
        console.log('📄 Contract code length:', code.length, 'characters');
      }
    } catch (error) {
      console.log('❌ Could not check if it\'s a contract:', error.message);
    }
    
    // Check 3: Get transaction count
    console.log('\n📋 Check 3: Transaction Count');
    try {
      const nonce = await provider.getTransactionCount(ADDRESS_TO_CHECK);
      console.log('✅ Transaction count (nonce):', nonce);
    } catch (error) {
      console.log('❌ Could not get transaction count:', error.message);
    }
    
    // Check 4: Check if it's your contract
    const YOUR_CONTRACT = "0x58ae7520F81DC3464574960B792D43A82BF0C3f1";
    console.log('\n📋 Check 4: Comparison with Your Contract');
    if (ADDRESS_TO_CHECK.toLowerCase() === YOUR_CONTRACT.toLowerCase()) {
      console.log('✅ This IS your Concordia contract address!');
    } else {
      console.log('❌ This is NOT your Concordia contract address');
      console.log('Your contract address:', YOUR_CONTRACT);
    }
    
    // Check 5: Check if it's your deployer address
    const YOUR_DEPLOYER = "0xdA13e8F82C83d14E7aa639354054B7f914cA0998";
    console.log('\n📋 Check 5: Comparison with Your Deployer');
    if (ADDRESS_TO_CHECK.toLowerCase() === YOUR_DEPLOYER.toLowerCase()) {
      console.log('✅ This IS your deployer address!');
    } else {
      console.log('❌ This is NOT your deployer address');
      console.log('Your deployer address:', YOUR_DEPLOYER);
    }
    
    console.log('\n🎉 Address check completed!');
    
  } catch (error) {
    console.error('❌ Error checking address:', error.message);
  }
}

// Run the check
checkAddress().catch(console.error); 