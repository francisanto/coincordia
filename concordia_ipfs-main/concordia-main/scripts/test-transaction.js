#!/usr/bin/env node

const { ethers } = require('ethers');

// Contract details
const CONTRACT_ADDRESS = "0x58ae7520F81DC3464574960B792D43A82BF0C3f1";
const RPC_URL = "https://opbnb-testnet-rpc.bnbchain.org";

// Test wallet (you'll need to replace with your actual wallet)
const TEST_WALLET_ADDRESS = "0xYourWalletAddress"; // Replace with your wallet
const TEST_PRIVATE_KEY = "0xYourPrivateKey"; // Replace with your private key

// Basic ABI for testing
const BASIC_ABI = [
  "function createGroup(string _name, string _description, uint256 _goalAmount, uint256 _duration, uint256 _withdrawalDate, uint8 _dueDay, string _metadataId, string _metadataHash) payable",
  "function getTotalGroups() view returns (uint256)",
  "function contractBalance() view returns (uint256)"
];

async function testTransaction() {
  console.log('🔍 Testing Transaction...\n');
  
  try {
    // Connect to opBNB testnet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Connected to opBNB Testnet');
    
    // Create wallet instance
    const wallet = new ethers.Wallet(TEST_PRIVATE_KEY, provider);
    console.log('✅ Wallet connected:', wallet.address);
    
    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Wallet balance:', ethers.formatEther(balance), 'BNB');
    
    if (balance === 0n) {
      console.log('❌ Wallet has no BNB. Please add test BNB to:', wallet.address);
      return;
    }
    
    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, BASIC_ABI, wallet);
    console.log('✅ Contract instance created');
    
    // Test parameters
    const testParams = {
      name: "Test Group",
      description: "Test Description",
      goalAmount: ethers.parseEther("0.001"), // 0.001 BNB
      duration: 30 * 24 * 60 * 60, // 30 days in seconds
      withdrawalDate: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
      dueDay: 1,
      metadataId: "test_object_123",
      metadataHash: "test_hash_123"
    };
    
    console.log('📋 Test Parameters:');
    console.log('- Name:', testParams.name);
    console.log('- Goal Amount:', ethers.formatEther(testParams.goalAmount), 'BNB');
    console.log('- Duration:', testParams.duration, 'seconds');
    
    // Estimate gas
    console.log('\n⛽ Estimating gas...');
    try {
      const gasEstimate = await contract.createGroup.estimateGas(
        testParams.name,
        testParams.description,
        testParams.goalAmount,
        testParams.duration,
        testParams.withdrawalDate,
        testParams.dueDay,
        testParams.metadataId,
        testParams.metadataHash,
        { value: testParams.goalAmount }
      );
      console.log('✅ Gas estimate:', gasEstimate.toString());
    } catch (gasError) {
      console.log('❌ Gas estimation failed:', gasError.message);
      return;
    }
    
    // Check if we have enough gas
    const gasPrice = await provider.getFeeData();
    const gasCost = gasEstimate * gasPrice.gasPrice;
    console.log('💰 Estimated gas cost:', ethers.formatEther(gasCost), 'BNB');
    
    const totalCost = testParams.goalAmount + gasCost;
    console.log('💰 Total cost (goal + gas):', ethers.formatEther(totalCost), 'BNB');
    
    if (balance < totalCost) {
      console.log('❌ Insufficient balance for transaction');
      console.log('Need:', ethers.formatEther(totalCost), 'BNB');
      console.log('Have:', ethers.formatEther(balance), 'BNB');
      return;
    }
    
    console.log('\n🚀 Transaction looks good! Ready to proceed.');
    console.log('To actually test the transaction, uncomment the code below.');
    
    // Uncomment to actually send transaction
    /*
    console.log('\n📤 Sending transaction...');
    const tx = await contract.createGroup(
      testParams.name,
      testParams.description,
      testParams.goalAmount,
      testParams.duration,
      testParams.withdrawalDate,
      testParams.dueDay,
      testParams.metadataId,
      testParams.metadataHash,
      { value: testParams.goalAmount }
    );
    
    console.log('⏳ Transaction sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('✅ Transaction confirmed!');
    console.log('📊 Gas used:', receipt.gasUsed.toString());
    */
    
  } catch (error) {
    console.error('❌ Error testing transaction:', error.message);
    
    // Common error analysis
    if (error.message.includes('insufficient funds')) {
      console.log('\n💡 Solution: Add more BNB to your wallet');
    } else if (error.message.includes('nonce')) {
      console.log('\n💡 Solution: Check your wallet nonce');
    } else if (error.message.includes('gas')) {
      console.log('\n💡 Solution: Increase gas limit or check gas price');
    } else if (error.message.includes('reverted')) {
      console.log('\n💡 Solution: Check contract function parameters');
    }
  }
}

// Run the test
testTransaction().catch(console.error);