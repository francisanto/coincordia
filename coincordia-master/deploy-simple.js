const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Concordia smart contract to opBNB Testnet...");

  // Configuration
  const PRIVATE_KEY = "87117ab7b5bedc4ff6487fde37c54b025ba0478f64a8e167bfde4e7b827d09d4";
  const RPC_URL = "https://opbnb-testnet-rpc.bnbchain.org";
  const CHAIN_ID = 5611;

  // Initialize provider and wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log(`📡 Connected to opBNB Testnet`);
  console.log(`👤 Deployer address: ${wallet.address}`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for deployment. Need at least 0.01 ETH");
  }

  // Read contract artifact
  const contractArtifactPath = path.join(__dirname, "artifacts/contracts/Concordia.sol/Concordia.json");
  
  if (!fs.existsSync(contractArtifactPath)) {
    console.log("📦 Compiling contracts first...");
    const { execSync } = require("child_process");
    execSync("npx hardhat compile", { stdio: "inherit" });
  }

  const contractJson = JSON.parse(fs.readFileSync(contractArtifactPath, "utf8"));
  const contractBytecode = contractJson.bytecode;
  const contractAbi = contractJson.abi;

  console.log("📦 Deploying Concordia contract...");

  // Create contract factory
  const ConcordiaFactory = new ethers.ContractFactory(contractAbi, contractBytecode, wallet);

  // Deploy the contract
  const concordia = await ConcordiaFactory.deploy();
  await concordia.waitForDeployment();

  // Get the deployed contract address
  const address = await concordia.getAddress();
  const deploymentTx = concordia.deploymentTransaction();

  console.log("✅ Concordia contract deployed successfully!");
  console.log("📍 Contract Address:", address);
  console.log("🔗 Transaction Hash:", deploymentTx?.hash);
  console.log("🌐 Network: opBNB Testnet");
  console.log("🔗 Explorer: https://testnet.bscscan.com/address/" + address);

  // Test basic functionality
  console.log("\n🧪 Testing contract functionality...");

  // Test owner
  const owner = await concordia.owner();
  console.log(`👑 Contract owner: ${owner}`);

  // Test total groups
  const totalGroups = await concordia.getTotalGroups();
  console.log(`📊 Total groups: ${totalGroups}`);

  // Test contract balance
  const contractBalance = await concordia.contractBalance();
  console.log(`💰 Contract balance: ${ethers.formatEther(contractBalance)} ETH`);

  // Generate admin API key
  const adminApiKey = generateSecureApiKey();

  console.log("\n📝 Environment variables to update:");
  console.log("=====================================");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
  console.log(`CONTRACT_ADDRESS=${address}`);
  console.log(`ADMIN_ADDRESS=${wallet.address}`);
  console.log(`ADMIN_API_KEY=${adminApiKey}`);
  console.log("=====================================");

  console.log("\n📋 Next Steps:");
  console.log("1. Copy the contract address above");
  console.log("2. Update your .env.local file with the new contract address");
  console.log("3. Update your backend .env file with the contract address and admin API key");
  console.log("4. Configure MongoDB URI in your backend .env file");
  console.log("5. Deploy to Railway using the deployment guide");

  // Save deployment info
  const deploymentInfo = {
    network: "opBNB Testnet",
    contractAddress: address,
    deployer: wallet.address,
    transactionHash: deploymentTx?.hash,
    deploymentDate: new Date().toISOString(),
    adminApiKey: adminApiKey,
    chainId: CHAIN_ID,
    rpcUrl: RPC_URL
  };

  fs.writeFileSync("deployment-info.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\n💾 Deployment info saved to deployment-info.json");

  return address;
}

function generateSecureApiKey() {
  const crypto = require("crypto");
  return crypto.randomBytes(32).toString("hex");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
