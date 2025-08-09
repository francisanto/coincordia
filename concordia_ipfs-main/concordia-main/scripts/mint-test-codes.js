const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 Minting test redemption codes...");

  // Get the deployed contract
  const contractAddress = "0x338E8AF72E83C131B07162BDd2ACA599D53Ce3e7";
  const AuraRedemptionNFT = await ethers.getContractFactory("AuraRedemptionNFT");
  const auraNFT = AuraRedemptionNFT.attach(contractAddress);

  // Get the signer (contract owner)
  const [signer] = await ethers.getSigners();
  console.log("👤 Minting with address:", signer.address);

  // Test recipient addresses (you can change these)
  const testRecipients = [
    "0xdA13e8F82C83d14E7aa639354054B7f914cA0998", // Owner
    "0x1234567890123456789012345678901234567890", // Test address 1
    "0x2345678901234567890123456789012345678901", // Test address 2
  ];

  // Generate test codes
  const testCodes = generateTestCodes(3);
  const testTiers = [1, 2, 3]; // Basic, Silver, Gold
  const testMetadataURIs = [
    "ipfs://QmTestBasicTier",
    "ipfs://QmTestSilverTier", 
    "ipfs://QmTestGoldTier"
  ];

  console.log("\n🎁 Minting redemption codes:");
  for (let i = 0; i < testCodes.length; i++) {
    const code = testCodes[i];
    const tier = testTiers[i];
    const recipient = testRecipients[i];
    const metadataURI = testMetadataURIs[i];
    const auraAmount = tier === 1 ? 100 : tier === 2 ? 250 : 500;

    console.log(`   Code ${i + 1}: ${code} (Tier ${tier}, ${auraAmount} Aura) -> ${recipient}`);

    try {
      const tx = await auraNFT.createRedemptionCode(recipient, code, tier, metadataURI);
      await tx.wait();
      console.log(`   ✅ Minted successfully! TX: ${tx.hash}`);
    } catch (error) {
      console.error(`   ❌ Failed to mint:`, error.message);
    }
  }

  // Verify the minted codes
  console.log("\n🔍 Verifying minted codes:");
  for (let i = 0; i < testCodes.length; i++) {
    const code = testCodes[i];
    const [isValid, isRedeemed, tokenId] = await auraNFT.checkCodeStatus(code);
    console.log(`   Code ${code}: Valid=${isValid}, Redeemed=${isRedeemed}, TokenID=${tokenId.toString()}`);
  }

  console.log("\n✅ Test code minting completed!");
  console.log("\n📋 Test codes for frontend testing:");
  testCodes.forEach((code, index) => {
    const tier = testTiers[index];
    const auraAmount = tier === 1 ? 100 : tier === 2 ? 250 : 500;
    console.log(`   ${code} (Tier ${tier}, ${auraAmount} Aura)`);
  });
}

function generateTestCodes(count) {
  const codes = [];
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (let i = 0; i < count; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push(code);
  }
  
  return codes;
}

// Execute minting
main()
  .then(() => {
    console.log("\n🎉 Minting completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Minting failed:", error);
    process.exit(1);
  }); 