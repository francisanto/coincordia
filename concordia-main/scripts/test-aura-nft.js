const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing AuraRedemptionNFT contract...");

  // Get the deployed contract
  const contractAddress = "0x338E8AF72E83C131B07162BDd2ACA599D53Ce3e7";
  const AuraRedemptionNFT = await ethers.getContractFactory("AuraRedemptionNFT");
  const auraNFT = AuraRedemptionNFT.attach(contractAddress);

  console.log("📋 Contract details:");
  console.log("   - Address:", contractAddress);
  console.log("   - Name:", await auraNFT.name());
  console.log("   - Symbol:", await auraNFT.symbol());
  console.log("   - Owner:", await auraNFT.owner());

  // Test tier amounts
  console.log("\n💰 Tier amounts:");
  console.log("   - Tier 1 (Basic):", await auraNFT.getAuraAmountForTier(1), "Aura");
  console.log("   - Tier 2 (Silver):", await auraNFT.getAuraAmountForTier(2), "Aura");
  console.log("   - Tier 3 (Gold):", await auraNFT.getAuraAmountForTier(3), "Aura");
  console.log("   - Tier 4 (Platinum):", await auraNFT.getAuraAmountForTier(4), "Aura");

  // Generate a test code
  const testCode = generateTestCode();
  console.log("\n🎁 Test redemption code:", testCode);

  // Check if code exists (should be false for new code)
  const [isValid, isRedeemed, tokenId] = await auraNFT.checkCodeStatus(testCode);
  console.log("   - Is Valid:", isValid);
  console.log("   - Is Redeemed:", isRedeemed);
  console.log("   - Token ID:", tokenId.toString());

  console.log("\n✅ Contract test completed successfully!");
  console.log("\n🔧 Next steps:");
  console.log("1. Mint some test redemption codes");
  console.log("2. Test the redemption process");
  console.log("3. Verify the frontend integration");
}

function generateTestCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Execute test
main()
  .then(() => {
    console.log("\n🎉 Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }); 