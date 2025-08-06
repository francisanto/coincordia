const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying AuraRedemptionNFT contract...");

  // Get the contract factory
  const AuraRedemptionNFT = await ethers.getContractFactory("AuraRedemptionNFT");
  
  // Deploy the contract
  const auraNFT = await AuraRedemptionNFT.deploy();
  
  // Wait for deployment to complete
  await auraNFT.waitForDeployment();
  
  const contractAddress = await auraNFT.getAddress();
  
  console.log("✅ AuraRedemptionNFT deployed to:", contractAddress);
  console.log("📋 Contract details:");
  console.log("   - Name: Aura Redemption Code");
  console.log("   - Symbol: AURACODE");
  console.log("   - Network: opBNB Testnet");
  console.log("   - Owner:", await auraNFT.owner());
  
  console.log("\n🔧 Next steps:");
  console.log("1. Update the contract address in components/aura-redemption-nft.tsx");
  console.log("2. Update the contract address in lib/aura-nft-service.ts");
  console.log("3. Test the contract with sample redemption codes");
  
  // Generate some sample redemption codes for testing
  console.log("\n🎁 Sample redemption codes for testing:");
  const sampleCodes = generateSampleCodes();
  sampleCodes.forEach((code, index) => {
    console.log(`   Code ${index + 1}: ${code.code} (Tier ${code.tier}, ${code.auraAmount} Aura)`);
  });
  
  return {
    contractAddress,
    sampleCodes
  };
}

function generateSampleCodes() {
  const codes = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (let i = 0; i < 5; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const tier = Math.floor(Math.random() * 4) + 1;
    const auraAmount = tier === 1 ? 100 : tier === 2 ? 250 : tier === 3 ? 500 : 1000;
    
    codes.push({
      code,
      tier,
      auraAmount
    });
  }
  
  return codes;
}

// Execute deployment
main()
  .then((result) => {
    console.log("\n🎉 Deployment completed successfully!");
    console.log("Contract address:", result.contractAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 