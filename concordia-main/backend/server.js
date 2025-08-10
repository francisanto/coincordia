const express = require("express")
const cors = require("cors")
const { ethers } = require("ethers")
const multer = require("multer")
const crypto = require("crypto")
require("dotenv").config()
const nodemailer = require("nodemailer");
const { OpenAI } = require("openai");
const { connectDB } = require("./db");
const Group = require("./models/Group");
const Invite = require("./models/Invite");
const User = require("./models/User");
const AuraReward = require("./models/AuraReward");

const app = express()
const PORT = process.env.PORT || 3002

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://concordia-production.up.railway.app",
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
})

// MongoDB Configuration
const MONGODB_CONFIG = {
  adminAddress: process.env.ADMIN_ADDRESS || "0x0000000000000000000000000000000000000000", // Admin wallet address for access control
}

// Initialize MongoDB Connection
async function initializeDatabase() {
  try {
    const connected = await connectDB();
    if (connected) {
      console.log("✅ MongoDB database initialized");
      
      // Create admin user if it doesn't exist
      await createAdminUserIfNotExists();
    }
  } catch (error) {
    console.error("❌ Failed to initialize MongoDB:", error);
  }
}

// Create admin user if it doesn't exist
async function createAdminUserIfNotExists() {
  try {
    const adminExists = await User.findOne({ address: MONGODB_CONFIG.adminAddress });
    
    if (!adminExists) {
      await User.create({
        address: MONGODB_CONFIG.adminAddress,
        nickname: "Admin",
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("✅ Admin user created");
    }
  } catch (error) {
    console.error("❌ Failed to create admin user:", error);
  }
}

async function createBucketIfNotExists() {
  try {
    const bucketInfo = await greenfieldClient.bucket.headBucket(GREENFIELD_CONFIG.bucketName)
    console.log("✅ Bucket exists:", GREENFIELD_CONFIG.bucketName)
  } catch (error) {
    if (error.code === "NoSuchBucket") {
      try {
        await greenfieldClient.bucket.createBucket({
          bucketName: GREENFIELD_CONFIG.bucketName,
          creator: process.env.GREENFIELD_ACCOUNT_ADDRESS,
          visibility: "VISIBILITY_TYPE_PUBLIC_READ",
          chargedReadQuota: "0",
          spAsDelegatedAgent: true,
        })
        console.log("✅ Bucket created:", GREENFIELD_CONFIG.bucketName)
      } catch (createError) {
        console.error("❌ Failed to create bucket:", createError)
      }
    } else {
      console.error("❌ Error checking bucket:", error)
    }
  }
}

// Smart Contract Configuration
const CONTRACT_CONFIG = {
  address: process.env.CONTRACT_ADDRESS || "0x1234567890123456789012345678901234567890",
  abi: [
    // Add your contract ABI here
    "function createGroup(string,string,uint256,uint256,uint256,uint8,string) external payable returns (uint256)",
    "function contribute(uint256) external payable",
    "function joinGroup(uint256) external payable",
    "function getGroup(uint256) external view returns (tuple(uint256,address,string,string,uint256,uint256,uint256,uint256,uint256,uint8,bool,uint256,string))",
    "function getGroupMembers(uint256) external view returns (address[])",
    "function getMemberDetails(uint256,address) external view returns (tuple(address,uint256,uint256,uint256,bool))",
    "function getUserGroups(address) external view returns (uint256[])",
    "event GroupCreated(uint256 indexed,address indexed,string,uint256,uint256,string)",
    "event ContributionMade(uint256 indexed,address indexed,uint256,uint256,bool)",
    "event MemberJoined(uint256 indexed,address indexed,uint256)",
  ],
}

// Initialize Web3 Provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://opbnb-testnet-rpc.bnbchain.org")
const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, provider)

// Utility Functions
function generateObjectId() {
  return crypto.randomBytes(16).toString("hex")
}

function generateInviteCode() {
  // Generate a 6-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
}

// Configure nodemailer (example with Gmail SMTP)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NOTIFY_EMAIL, // set in .env
    pass: process.env.NOTIFY_EMAIL_PASS, // set in .env
  },
});

// Configure OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper to generate AI message
async function generateAIDueDateMessage(memberName, groupName, dueDate) {
  const prompt = `Write a friendly reminder email for ${memberName} that their payment is due for the group savings \"${groupName}\" on ${dueDate}.`;
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 120,
  });
  return completion.choices[0].message.content;
}

// Endpoint to send due date notifications
app.post("/api/notify-due-date", async (req, res) => {
  const { groupId } = req.body;
  if (!groupId) return res.status(400).json({ error: "groupId required" });

  try {
    // Fetch group data from Greenfield
    const objectName = `groups/group_${groupId}.json`;
    const objectData = await greenfieldClient.object.downloadFile({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName,
    });
    const group = JSON.parse(objectData.toString());

    // For each member with an email, send notification
    for (const member of group.members) {
      if (member.email) {
        // Generate AI message
        const message = await generateAIDueDateMessage(
          member.nickname,
          group.name,
          group.nextContribution // or due date
        );

        // Send email
        await transporter.sendMail({
          from: process.env.NOTIFY_EMAIL,
          to: member.email,
          subject: `Payment Due Reminder: ${group.name}`,
          text: message,
        });
      }
    }
    res.json({ success: true, message: "Notifications sent" });
  } catch (error) {
    console.error("Error sending due date notifications:", error);
    res.status(500).json({ error: "Failed to send notifications", details: error.message });
  }
});

// API Routes

/**
 * Health Check
 */
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    services: {
      greenfield: !!greenfieldClient,
      blockchain: !!contract,
    },
  })
})

// Import routes
const groupsRoutes = require('./routes/groups');
const usersRoutes = require('./routes/users');
const auraRoutes = require('./routes/aura');
const bucketsRoutes = require('./routes/buckets');

// Use routes
app.use('/api/groups', groupsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/aura', auraRoutes);
app.use('/api/buckets', bucketsRoutes);

/**
 * Store Group Data in Greenfield
 */
app.post("/api/groups/store", async (req, res) => {
  try {
    const { groupId, groupData } = req.body

    if (!groupId || !groupData) {
      return res.status(400).json({ error: "Group ID and data are required" })
    }

    const objectName = `groups/group_${groupId}.json`
    const objectId = generateObjectId()

    // Prepare metadata
    const metadata = {
      groupId,
      ...groupData,
      inviteCode: generateInviteCode(), // Generate invite code
      createdAt: new Date().toISOString(),
      objectId,
      version: "1.0",
    }

    // Generate metadata hash
    const metadataString = JSON.stringify(metadata, Object.keys(metadata).sort())
    const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex')

    // Add metadata hash to the data
    if (metadata.greenfield) {
      metadata.greenfield.metadataHash = metadataHash
    }

    // Store in Greenfield
    const createObjectTx = await greenfieldClient.object.createObject({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
      creator: process.env.GREENFIELD_ACCOUNT_ADDRESS,
      visibility: "VISIBILITY_TYPE_PUBLIC_READ",
      contentType: "application/json",
      redundancyType: "REDUNDANCY_EC_TYPE",
      payload: Buffer.from(JSON.stringify(metadata)),
    })

    console.log("✅ Group data stored in Greenfield:", objectName)

    res.json({
      success: true,
      objectId,
      objectName,
      metadataHash,
      transactionHash: createObjectTx.transactionHash,
      metadata,
    })
  } catch (error) {
    console.error("❌ Error storing group data:", error)
    res.status(500).json({
      error: "Failed to store group data",
      details: error.message,
    })
  }
})

/**
 * Get All Groups from Greenfield
 */
app.get("/api/groups", async (req, res) => {
  try {
    // List all objects in the groups folder
    const listObjectsResponse = await greenfieldClient.object.listObjects({
      bucketName: GREENFIELD_CONFIG.bucketName,
      prefix: "groups/",
      maxKeys: 1000,
    })

    if (!listObjectsResponse.objects || listObjectsResponse.objects.length === 0) {
      return res.json({
        success: true,
        groups: [],
      })
    }

    // Fetch all group data
    const groups = []
    for (const object of listObjectsResponse.objects) {
      try {
        const objectData = await greenfieldClient.object.downloadFile({
          bucketName: GREENFIELD_CONFIG.bucketName,
          objectName: object.objectName,
        })

        const groupData = JSON.parse(objectData.toString())
        groups.push(groupData)
      } catch (error) {
        console.error(`Error fetching group ${object.objectName}:`, error)
      }
    }

    console.log("✅ Retrieved all groups:", groups.length)

    res.json({
      success: true,
      groups,
    })
  } catch (error) {
    console.error("❌ Error retrieving all groups:", error)
    res.status(500).json({
      error: "Failed to retrieve groups",
      details: error.message,
    })
  }
})

/**
 * Retrieve Group Data from Greenfield
 */
app.get("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params
    const objectName = `groups/group_${groupId}.json`

    // Get object from Greenfield
    const objectInfo = await greenfieldClient.object.headObject(GREENFIELD_CONFIG.bucketName, objectName)

    if (!objectInfo) {
      return res.status(404).json({ error: "Group not found" })
    }

    // Download object content
    const objectData = await greenfieldClient.object.downloadFile({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
    })

    const metadata = JSON.parse(objectData.toString())

    res.json({
      success: true,
      groupId,
      metadata,
      objectInfo,
    })
  } catch (error) {
    console.error("❌ Error retrieving group data:", error)

    if (error.code === "NoSuchKey") {
      return res.status(404).json({ error: "Group not found" })
    }

    res.status(500).json({
      error: "Failed to retrieve group data",
      details: error.message,
    })
  }
})

/**
 * Find Group by Code
 */
app.get("/api/groups/code/:code", async (req, res) => {
  try {
    const { code } = req.params
    
    // List all objects in the groups folder
    const listObjectsResponse = await greenfieldClient.object.listObjects({
      bucketName: GREENFIELD_CONFIG.bucketName,
      prefix: "groups/",
      maxKeys: 1000,
    })

    if (!listObjectsResponse.objects || listObjectsResponse.objects.length === 0) {
      return res.status(404).json({ error: "No groups found" })
    }

    // Search through all groups for the code
    for (const object of listObjectsResponse.objects) {
      try {
        const objectData = await greenfieldClient.object.downloadFile({
          bucketName: GREENFIELD_CONFIG.bucketName,
          objectName: object.objectName,
        })

        const groupData = JSON.parse(objectData.toString())
        
        // Check if this group has the code
        if (groupData.inviteCode === code || groupData.code === code) {
          const groupId = groupData.id || groupData.groupId
          return res.json({
            success: true,
            groupId,
            group: groupData
          })
        }
      } catch (error) {
        console.error(`Error checking group ${object.objectName}:`, error)
      }
    }

    res.status(404).json({ error: "Group not found with this code" })
  } catch (error) {
    console.error("❌ Error finding group by code:", error)
    res.status(500).json({
      error: "Failed to find group by code",
      details: error.message,
    })
  }
})

/**
 * Update Group Data in Greenfield
 */
app.put("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params
    const { updateData } = req.body

    const objectName = `groups/group_${groupId}.json`

    // Get existing data
    const existingData = await greenfieldClient.object.downloadFile({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
    })

    const existingMetadata = JSON.parse(existingData.toString())

    // Merge with update data
    const updatedMetadata = {
      ...existingMetadata,
      ...updateData,
      updatedAt: new Date().toISOString(),
      version: (Number.parseFloat(existingMetadata.version) + 0.1).toFixed(1),
    }

    // Update object in Greenfield
    const updateTx = await greenfieldClient.object.putObject({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
      body: Buffer.from(JSON.stringify(updatedMetadata)),
    })

    console.log("✅ Group data updated in Greenfield:", objectName)

    res.json({
      success: true,
      groupId,
      transactionHash: updateTx.transactionHash,
      metadata: updatedMetadata,
    })
  } catch (error) {
    console.error("❌ Error updating group data:", error)
    res.status(500).json({
      error: "Failed to update group data",
      details: error.message,
    })
  }
})

/**
 * Delete Group Data from Greenfield
 */
app.delete("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params
    const objectName = `groups/group_${groupId}.json`

    // Delete object from Greenfield
    await greenfieldClient.object.deleteObject({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
    })

    console.log("✅ Group data deleted from Greenfield:", objectName)

    res.json({
      success: true,
      message: "Group deleted successfully",
    })
  } catch (error) {
    console.error("❌ Error deleting group data:", error)
    res.status(500).json({
      error: "Failed to delete group data",
      details: error.message,
    })
  }
})

/**
 * Update Group Metadata in Greenfield
 */
app.put("/api/groups/:groupId/update", async (req, res) => {
  try {
    const { groupId } = req.params
    const { updates } = req.body

    if (!updates) {
      return res.status(400).json({ error: "Updates are required" })
    }

    const objectName = `groups/group_${groupId}.json`

    // Get existing data
    const existingData = await greenfieldClient.object.downloadFile({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
    })

    const existingMetadata = JSON.parse(existingData.toString())

    // Merge with updates
    const updatedMetadata = {
      ...existingMetadata,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (Number.parseFloat(existingMetadata.version) + 0.1).toFixed(1),
    }

    // Generate new metadata hash
    const crypto = require('crypto')
    const metadataString = JSON.stringify(updatedMetadata, Object.keys(updatedMetadata).sort())
    const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex')

    // Update metadata hash in the data
    if (updatedMetadata.greenfield) {
      updatedMetadata.greenfield.metadataHash = metadataHash
    }

    // Update object in Greenfield
    const updateTx = await greenfieldClient.object.putObject({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
      body: Buffer.from(JSON.stringify(updatedMetadata)),
    })

    console.log("✅ Group metadata updated in Greenfield:", objectName)

    res.json({
      success: true,
      groupId,
      metadataHash,
      transactionHash: updateTx.transactionHash,
      metadata: updatedMetadata,
    })
  } catch (error) {
    console.error("❌ Error updating group metadata:", error)
    res.status(500).json({
      error: "Failed to update group metadata",
      details: error.message,
    })
  }
})

/**
 * Store Contribution Data
 */
app.post("/api/contributions/store", async (req, res) => {
  try {
    const { groupId, contributionData } = req.body

    const objectName = `contributions/group_${groupId}_contributions.json`

    let existingContributions = []

    // Try to get existing contributions
    try {
      const existingData = await greenfieldClient.object.downloadFile({
        bucketName: GREENFIELD_CONFIG.bucketName,
        objectName: objectName,
      })
      existingContributions = JSON.parse(existingData.toString())
    } catch (error) {
      // File doesn't exist, start with empty array
      console.log("Creating new contributions file for group:", groupId)
    }

    // Add new contribution
    const newContribution = {
      ...contributionData,
      id: generateObjectId(),
      timestamp: new Date().toISOString(),
    }

    existingContributions.push(newContribution)

    // Store updated contributions
    const storeTx = await greenfieldClient.object.putObject({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
      body: Buffer.from(JSON.stringify(existingContributions)),
    })

    console.log("✅ Contribution stored in Greenfield:", objectName)

    res.json({
      success: true,
      contributionId: newContribution.id,
      transactionHash: storeTx.transactionHash,
      totalContributions: existingContributions.length,
    })
  } catch (error) {
    console.error("❌ Error storing contribution:", error)
    res.status(500).json({
      error: "Failed to store contribution",
      details: error.message,
    })
  }
})

/**
 * Get Group Contributions
 */
app.get("/api/contributions/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params
    const objectName = `contributions/group_${groupId}_contributions.json`

    const contributionsData = await greenfieldClient.object.downloadFile({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
    })

    const contributions = JSON.parse(contributionsData.toString())

    res.json({
      success: true,
      groupId,
      contributions,
      count: contributions.length,
    })
  } catch (error) {
    if (error.code === "NoSuchKey") {
      return res.json({
        success: true,
        groupId: req.params.groupId,
        contributions: [],
        count: 0,
      })
    }

    console.error("❌ Error retrieving contributions:", error)
    res.status(500).json({
      error: "Failed to retrieve contributions",
      details: error.message,
    })
  }
})

/**
 * Store Member Invites
 */
app.post("/api/invites/store", async (req, res) => {
  try {
    const { groupId, inviteData } = req.body

    const objectName = `invites/group_${groupId}_invites.json`

    let existingInvites = []

    // Try to get existing invites
    try {
      const existingData = await greenfieldClient.object.downloadFile({
        bucketName: GREENFIELD_CONFIG.bucketName,
        objectName: objectName,
      })
      existingInvites = JSON.parse(existingData.toString())
    } catch (error) {
      console.log("Creating new invites file for group:", groupId)
    }

    // Add new invite
    const newInvite = {
      ...inviteData,
      id: generateObjectId(),
      timestamp: new Date().toISOString(),
      status: "pending",
    }

    existingInvites.push(newInvite)

    // Store updated invites
    const storeTx = await greenfieldClient.object.putObject({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
      body: Buffer.from(JSON.stringify(existingInvites)),
    })

    console.log("✅ Invite stored in Greenfield:", objectName)

    res.json({
      success: true,
      inviteId: newInvite.id,
      transactionHash: storeTx.transactionHash,
      totalInvites: existingInvites.length,
    })
  } catch (error) {
    console.error("❌ Error storing invite:", error)
    res.status(500).json({
      error: "Failed to store invite",
      details: error.message,
    })
  }
})

/**
 * Get Group Invites
 */
app.get("/api/invites/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params
    const objectName = `invites/group_${groupId}_invites.json`

    const invitesData = await greenfieldClient.object.downloadFile({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
    })

    const invites = JSON.parse(invitesData.toString())

    res.json({
      success: true,
      groupId,
      invites,
      count: invites.length,
    })
  } catch (error) {
    if (error.code === "NoSuchKey") {
      return res.json({
        success: true,
        groupId: req.params.groupId,
        invites: [],
        count: 0,
      })
    }

    console.error("❌ Error retrieving invites:", error)
    res.status(500).json({
      error: "Failed to retrieve invites",
      details: error.message,
    })
  }
})

/**
 * Get Blockchain Group Data
 */
app.get("/api/blockchain/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params

    // Get group data from smart contract
    const groupData = await contract.getGroup(groupId)
    const members = await contract.getGroupMembers(groupId)

    // Get member details
    const memberDetails = []
    for (const memberAddress of members) {
      const details = await contract.getMemberDetails(groupId, memberAddress)
      memberDetails.push({
        address: memberAddress,
        ...details,
      })
    }

    res.json({
      success: true,
      groupId,
      groupData: {
        id: groupData[0].toString(),
        creator: groupData[1],
        teamName: groupData[2],
        description: groupData[3],
        contributionAmount: ethers.formatEther(groupData[4]),
        targetAmount: ethers.formatEther(groupData[5]),
        currentAmount: ethers.formatEther(groupData[6]),
        duration: groupData[7].toString(),
        withdrawalDate: groupData[8].toString(),
        dueDay: groupData[9],
        isActive: groupData[10],
        createdAt: groupData[11].toString(),
        greenfieldObjectId: groupData[12],
      },
      members: memberDetails.map((member) => ({
        address: member.address,
        totalContributed: ethers.formatEther(member[1]),
        auraPoints: member[2].toString(),
        joinedAt: member[3].toString(),
        isActive: member[4],
      })),
    })
  } catch (error) {
    console.error("❌ Error getting blockchain data:", error)
    res.status(500).json({
      error: "Failed to get blockchain data",
      details: error.message,
    })
  }
})

/**
 * Get User Groups from Blockchain
 */
app.get("/api/blockchain/users/:address/groups", async (req, res) => {
  try {
    const { address } = req.params

    if (!ethers.isAddress(address)) {
      return res.status(400).json({ error: "Invalid address" })
    }

    const userGroups = await contract.getUserGroups(address)

    res.json({
      success: true,
      address,
      groupIds: userGroups.map((id) => id.toString()),
      count: userGroups.length,
    })
  } catch (error) {
    console.error("❌ Error getting user groups:", error)
    res.status(500).json({
      error: "Failed to get user groups",
      details: error.message,
    })
  }
})

/**
 * Upload File to Greenfield
 */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    const { originalname, buffer, mimetype } = req.file
    const sanitizedName = sanitizeFileName(originalname)
    const objectName = `uploads/${Date.now()}_${sanitizedName}`
    const objectId = generateObjectId()

    // Upload to Greenfield
    const uploadTx = await greenfieldClient.object.createObject({
      bucketName: GREENFIELD_CONFIG.bucketName,
      objectName: objectName,
      creator: process.env.GREENFIELD_ACCOUNT_ADDRESS,
      visibility: "VISIBILITY_TYPE_PUBLIC_READ",
      contentType: mimetype,
      redundancyType: "REDUNDANCY_EC_TYPE",
      payload: buffer,
    })

    console.log("✅ File uploaded to Greenfield:", objectName)

    res.json({
      success: true,
      objectId,
      objectName,
      originalName: originalname,
      size: buffer.length,
      contentType: mimetype,
      transactionHash: uploadTx.transactionHash,
      url: `${GREENFIELD_CONFIG.endpoint}/${GREENFIELD_CONFIG.bucketName}/${objectName}`,
    })
  } catch (error) {
    console.error("❌ Error uploading file:", error)
    res.status(500).json({
      error: "Failed to upload file",
      details: error.message,
    })
  }
})

/**
 * Get Analytics Data
 */
app.get("/api/analytics/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params

    // Get contributions from Greenfield
    const contributionsResponse = await fetch(`${req.protocol}://${req.get("host")}/api/contributions/${groupId}`)
    const contributionsData = await contributionsResponse.json()

    // Get blockchain data
    const blockchainResponse = await fetch(`${req.protocol}://${req.get("host")}/api/blockchain/groups/${groupId}`)
    const blockchainData = await blockchainResponse.json()

    if (!contributionsData.success || !blockchainData.success) {
      throw new Error("Failed to fetch data")
    }

    const contributions = contributionsData.contributions
    const groupData = blockchainData.groupData

    // Calculate analytics
    const analytics = {
      totalContributions: contributions.length,
      totalAmount: groupData.currentAmount,
      averageContribution:
        contributions.length > 0 ? (Number.parseFloat(groupData.currentAmount) / contributions.length).toFixed(4) : "0",
      progressPercentage: (
        (Number.parseFloat(groupData.currentAmount) / Number.parseFloat(groupData.targetAmount)) *
        100
      ).toFixed(2),
      earlyContributions: contributions.filter((c) => c.isEarly).length,
      lateContributions: contributions.filter((c) => !c.isEarly).length,
      memberCount: blockchainData.members.length,
      averageAuraPoints:
        blockchainData.members.length > 0
          ? (
              blockchainData.members.reduce((sum, m) => sum + Number.parseInt(m.auraPoints), 0) /
              blockchainData.members.length
            ).toFixed(1)
          : "0",
      contributionTrend: contributions.slice(-7).map((c) => ({
        date: new Date(c.timestamp).toISOString().split("T")[0],
        amount: c.amount,
        contributor: c.contributor,
      })),
    }

    res.json({
      success: true,
      groupId,
      analytics,
    })
  } catch (error) {
    console.error("❌ Error getting analytics:", error)
    res.status(500).json({
      error: "Failed to get analytics",
      details: error.message,
    })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("❌ Server error:", error)
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" })
})

// Initialize and start server
async function startServer() {
  try {
    await initializeDatabase()

    app.listen(PORT, () => {
      console.log(`🚀 Concordia Backend Server running on port ${PORT}`)
      console.log(`📊 Health check: /api/health (port ${PORT})`)
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`)
    })
  } catch (error) {
    console.error("❌ Failed to start server:", error)
    process.exit(1)
  }
}

startServer()

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully")
  process.exit(0)
})
