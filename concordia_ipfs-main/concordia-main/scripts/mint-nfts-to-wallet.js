const { ethers } = require("hardhat");

async function main() {
  console.log("🎨 Minting test NFTs to your wallet...");

  // Get the deployed contract
  const contractAddress = "0x338E8AF72E83C131B07162BDd2ACA599D53Ce3e7";
  const AuraRedemptionNFT = await ethers.getContractFactory("AuraRedemptionNFT");
  const auraNFT = AuraRedemptionNFT.attach(contractAddress);

  // Get the signer (contract owner)
  const [signer] = await ethers.getSigners();
  console.log("👤 Minting with address:", signer.address);

  // Test wallet address (you can change this to your wallet address)
  const testWalletAddress = "0xdA13e8F82C83d14E7aa639354054B7f914cA0998"; // Change this to your wallet

  // Generate test codes for different tiers
  const testCodes = generateTestCodes(8); // Generate 8 test codes
  const testTiers = [1, 1, 2, 2, 3, 3, 4, 4]; // Mix of all tiers
  const testMetadataURIs = [
    "ipfs://QmBasicTier1",
    "ipfs://QmBasicTier2", 
    "ipfs://QmSilverTier1",
    "ipfs://QmSilverTier2",
    "ipfs://QmGoldTier1",
    "ipfs://QmGoldTier2",
    "ipfs://QmPlatinumTier1",
    "ipfs://QmPlatinumTier2"
  ];

  console.log("\n🎁 Minting NFTs to wallet:", testWalletAddress);
  console.log("📋 Test codes to be minted:");

  for (let i = 0; i < testCodes.length; i++) {
    const code = testCodes[i];
    const tier = testTiers[i];
    const metadataURI = testMetadataURIs[i];
    const auraAmount = tier === 1 ? 100 : tier === 2 ? 250 : tier === 3 ? 500 : 1000;
    const tierName = tier === 1 ? "Basic" : tier === 2 ? "Silver" : tier === 3 ? "Gold" : "Platinum";

    console.log(`   ${i + 1}. ${code} (${tierName} Tier, ${auraAmount} Aura)`);

    try {
      const tx = await auraNFT.createRedemptionCode(testWalletAddress, code, tier, metadataURI);
      await tx.wait();
      console.log(`   ✅ Minted successfully! TX: ${tx.hash}`);
    } catch (error) {
      console.error(`   ❌ Failed to mint:`, error.message);
    }
  }

  // Verify the minted NFTs
  console.log("\n🔍 Verifying minted NFTs:");
  for (let i = 0; i < testCodes.length; i++) {
    const code = testCodes[i];
    const [isValid, isRedeemed, tokenId] = await auraNFT.checkCodeStatus(code);
    const tier = testTiers[i];
    const tierName = tier === 1 ? "Basic" : tier === 2 ? "Silver" : tier === 3 ? "Gold" : "Platinum";
    
    console.log(`   Code ${code}: Valid=${isValid}, Redeemed=${isRedeemed}, TokenID=${tokenId.toString()}, Tier=${tierName}`);
  }

  // Get all NFTs for the wallet
  console.log("\n📊 Wallet NFT Summary:");
  const [codes, tokenIds] = await auraNFT.getRedemptionCodesForAddress(testWalletAddress);
  console.log(`   Total NFTs in wallet: ${codes.length}`);
  
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const tokenId = tokenIds[i];
    const [isValid, isRedeemed] = await auraNFT.checkCodeStatus(code);
    console.log(`   NFT #${tokenId}: ${code} (${isRedeemed ? 'Redeemed' : 'Available'})`);
  }

  console.log("\n✅ NFT minting completed!");
  console.log("\n🎉 Your wallet now contains beautiful NFT redemption codes!");
  console.log("\n📱 Next steps:");
  console.log("1. Open your Concordia DApp");
  console.log("2. Connect your wallet");
  console.log("3. Navigate to the NFT Wallet Display");
  console.log("4. View your beautiful NFT collection!");
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
    console.log("\n🎉 NFT minting completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ NFT minting failed:", error);
    process.exit(1);
  }); 