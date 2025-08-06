const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Concordia smart contract to opBNB Testnet...");

  // Get the contract factory
  const Concordia = await ethers.getContractFactory("Concordia");
  
  // Deploy the contract
  const concordia = await Concordia.deploy();
  
  // Wait for deployment to complete
  await concordia.waitForDeployment();
  
  // Get the deployed contract address
  const address = await concordia.getAddress();
  
  console.log("✅ Concordia contract deployed successfully!");
  console.log("📍 Contract Address:", address);
  console.log("🌐 Network: opBNB Testnet");
  console.log("🔗 Explorer: https://testnet.bscscan.com/address/" + address);
  
  console.log("\n📝 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Add it to your .env.local file as NEXT_PUBLIC_CONTRACT_ADDRESS");
  console.log("3. Deploy to Vercel using the deployment guide");
  
  return address;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 