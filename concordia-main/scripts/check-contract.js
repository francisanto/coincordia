#!/usr/bin/env node

const { ethers } = require('ethers');

// Contract details
const CONTRACT_ADDRESS = "0x76a9C6d5EE759b0b5Ef4c7D9963523d247cBeF88";
const RPC_URL = "https://opbnb-testnet-rpc.bnbchain.org";

// Basic ABI for checking contract
const BASIC_ABI = [
  "function owner() view returns (address)",
  "function getTotalGroups() view returns (uint256)",
  "function contractBalance() view returns (uint256)"
];

async function checkContract() {
  console.log('🔍 Checking Contract Validity...\n');
  
  try {
    // Connect to opBNB testnet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Connected to opBNB Testnet');
    
    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, BASIC_ABI, provider);
    console.log('✅ Contract instance created');
    
    // Check 1: Contract exists and is deployed
    console.log('\n📋 Check 1: Contract Deployment');
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x') {
      console.log('❌ Contract is NOT deployed at this address');
      return;
    } else {
      console.log('✅ Contract is deployed and has code');
    }
    
    // Check 2: Get contract owner
    console.log('\n📋 Check 2: Contract Owner');
    try {
      const owner = await contract.owner();
      console.log('✅ Contract owner:', owner);
    } catch (error) {
      console.log('❌ Could not get contract owner:', error.message);
    }
    
    // Check 3: Get total groups
    console.log('\n📋 Check 3: Total Groups');
    try {
      const totalGroups = await contract.getTotalGroups();
      console.log('✅ Total groups created:', totalGroups.toString());
    } catch (error) {
      console.log('❌ Could not get total groups:', error.message);
    }
    
    // Check 4: Get contract balance
    console.log('\n📋 Check 4: Contract Balance');
    try {
      const balance = await contract.contractBalance();
      console.log('✅ Contract balance:', ethers.formatEther(balance), 'BNB');
    } catch (error) {
      console.log('❌ Could not get contract balance:', error.message);
    }
    
    // Check 5: Get ETH balance of contract address
    console.log('\n📋 Check 5: ETH Balance');
    try {
      const ethBalance = await provider.getBalance(CONTRACT_ADDRESS);
      console.log('✅ ETH balance:', ethers.formatEther(ethBalance), 'BNB');
    } catch (error) {
      console.log('❌ Could not get ETH balance:', error.message);
    }
    
    console.log('\n🎉 Contract validation completed!');
    console.log('\n📊 Summary:');
    console.log('- Contract Address:', CONTRACT_ADDRESS);
    console.log('- Network: opBNB Testnet');
    console.log('- RPC URL:', RPC_URL);
    
  } catch (error) {
    console.error('❌ Error checking contract:', error.message);
  }
}

// Run the check
checkContract().catch(console.error); 