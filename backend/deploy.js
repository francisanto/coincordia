const { ethers } = require("ethers")
const fs = require("fs")
const path = require("path")
require("dotenv").config()

const contractArtifactPath = path.join(
  __dirname,
  "../artifacts/contracts/Concordia.sol/Concordia.json"
)
const contractJson = JSON.parse(fs.readFileSync(contractArtifactPath, "utf8"))

// Concordia Smart Contract ABI (MongoDB only, no Greenfield)
const CONCORDIA_ABI = [
  {
    inputs: [
      { name: "_name", type: "string" },
      { name: "_description", type: "string" },
      { name: "_goalAmount", type: "uint256" },
      { name: "_duration", type: "uint256" },
      { name: "_withdrawalDate", type: "uint256" },
      { name: "_dueDay", type: "uint8" },
      { name: "_greenfieldObjectId", type: "string" }, // keep param but unused
      { name: "_greenfieldMetadataHash", type: "string" }, // keep param but unused
    ],
    name: "createGroup",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "nickname", type: "string" },
    ],
    name: "joinGroup",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "contribute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "voteForWithdrawal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "emergencyWithdrawal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "getGroupDetails",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "name", type: "string" },
          { name: "description", type: "string" },
          { name: "goalAmount", type: "uint256" },
          { name: "dueDay", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "withdrawalDate", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "isActive", type: "bool" },
          { name: "createdAt", type: "uint256" },
          { name: "totalContributions", type: "uint256" },
          { name: "memberCount", type: "uint256" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "getMemberDetails",
    outputs: [
      {
        components: [
          { name: "isMember", type: "bool" },
          { name: "contribution", type: "uint256" },
          { name: "auraPoints", type: "uint256" },
          { name: "hasVoted", type: "bool" },
          { name: "joinedAt", type: "uint256" },
          { name: "nickname", type: "string" },
        ],
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "getMembers",
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "getGroupContributions",
    outputs: [
      {
        components: [
          { name: "contributor", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "timestamp", type: "uint256" },
          { name: "auraPoints", type: "uint256" },
          { name: "isEarly", type: "bool" },
          { name: "transactionHash", type: "string" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "groupId", type: "uint256" }],
    name: "getGroupBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "contractBalance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalGroups",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "groupId", type: "uint256" },
      { name: "user", type: "address" },
    ],
    name: "isGroupMember",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawStuckFunds",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
]

// Contract bytecode from build artifacts
const CONCORDIA_BYTECODE = contractJson.bytecode

async function deployContract() {
  try {
    console.log("🚀 Starting Concordia Smart Contract deployment...")

    const network = process.env.NETWORK || "opBNB Testnet"
    const rpcUrl =
      process.env.RPC_URL || "https://opbnb-testnet-rpc.bnbchain.org"
    const privateKey = process.env.PRIVATE_KEY

    if (!privateKey) {
      throw new Error("PRIVATE_KEY environment variable is required")
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const wallet = new ethers.Wallet(privateKey, provider)

    console.log(`📡 Connected to ${network}`)
    console.log(`👤 Deployer address: ${wallet.address}`)

    const balance = await provider.getBalance(wallet.address)
    console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`)

    if (balance < ethers.parseEther("0.01")) {
      throw new Error("Insufficient balance for deployment")
    }

    const ConcordiaFactory = new ethers.ContractFactory(
      CONCORDIA_ABI,
      CONCORDIA_BYTECODE,
      wallet
    )

    console.log("📦 Deploying Concordia contract...")

    const contract = await ConcordiaFactory.deploy()
    await contract.waitForDeployment()

    const contractAddress = await contract.getAddress()
    const deploymentTx = contract.deploymentTransaction()

    console.log("✅ Contract deployed successfully!")
    console.log(`📍 Contract Address: ${contractAddress}`)
    console.log(`🔗 Transaction Hash: ${deploymentTx?.hash}`)

    // Verify code
    const code = await provider.getCode(contractAddress)
    if (code === "0x") {
      throw new Error("Contract deployment failed - no code at address")
    }

    console.log("✅ Contract verification successful")

    // Test functions
    const owner = await contract.owner()
    console.log(`👑 Contract owner: ${owner}`)

    const totalGroups = await contract.getTotalGroups()
    console.log(`📊 Total groups: ${totalGroups}`)

    const contractBalance = await contract.contractBalance()
    console.log(
      `💰 Contract balance: ${ethers.formatEther(contractBalance)} ETH`
    )

    // Save deployment info
    const deploymentInfo = {
      network,
      contractAddress,
      deployer: wallet.address,
      transactionHash: deploymentTx?.hash,
      blockNumber: deploymentTx?.blockNumber,
      gasUsed: deploymentTx?.gasLimit?.toString(),
      deploymentDate: new Date().toISOString(),
      abi: CONCORDIA_ABI,
      mongodbIntegration: {
        enabled: true,
        storageType: "MongoDB",
        description: "All data stored in MongoDB Atlas",
      },
    }

    fs.writeFileSync(
      path.join(__dirname, "deployment.json"),
      JSON.stringify(deploymentInfo, null, 2)
    )
    console.log("💾 Deployment info saved to deployment.json")

    const envContent = `# Concordia Smart Contract Deployment
NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}
NEXT_PUBLIC_NETWORK=${network}
NEXT_PUBLIC_RPC_URL=${rpcUrl}

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/concordia?retryWrites=true&w=majority

# Backend Configuration
PORT=${process.env.PORT || 3001}
FRONTEND_URL=${process.env.FRONTEND_URL}

# Admin Configuration
ADMIN_ADDRESS=${wallet.address}
ADMIN_API_KEY=your-secure-admin-api-key-here
`
    fs.writeFileSync(path.join(__dirname, ".env.deployment"), envContent)
    console.log("📝 Environment variables saved to .env.deployment")

    return { success: true, contractAddress, transactionHash: deploymentTx?.hash }
  } catch (error) {
    console.error("❌ Deployment failed:", error)
    return { success: false, error: error.message }
  }
}

if (require.main === module) {
  deployContract()
    .then((result) => {
      if (result.success) process.exit(0)
      else process.exit(1)
    })
    .catch((error) => {
      console.error("❌ Unexpected error:", error)
      process.exit(1)
    })
}

module.exports = { deployContract }
