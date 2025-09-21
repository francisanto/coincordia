const express = require("express")
const cors = require("cors")
const { ethers } = require("ethers")
const multer = require("multer")
const crypto = require("crypto")
require("dotenv").config()
const nodemailer = require("nodemailer");
const { OpenAI } = require("openai");
const { MongoClient } = require("mongodb");

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
})

// MongoDB Configuration
const MONGODB_CONFIG = {
  uri: process.env.MONGODB_URI || "mongodb://localhost:27017/concordia",
  dbName: process.env.MONGODB_DB_NAME || "concordia",
  collections: {
    groups: "groups",
    invites: "invites",
    uploads: "uploads",
    contributions: "contributions",
    aura: {
      purchases: "aura_purchases",
      users: "aura_users",
      rewards: "aura_rewards"
    }
  }
}

// Initialize MongoDB Client
let mongoClient
let db

async function connectToMongoDB() {
  try {
    if (mongoClient) {
      return { client: mongoClient, db }
    }
    
    mongoClient = new MongoClient(MONGODB_CONFIG.uri)
    await mongoClient.connect()
    db = mongoClient.db(MONGODB_CONFIG.dbName)
    console.log("✅ MongoDB connected successfully")
    return { client: mongoClient, db }
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error)
    throw error
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
    // Fetch group data from MongoDB
    const { db } = await connectToMongoDB();
    const group = await db.collection(MONGODB_CONFIG.collections.groups).findOne({ id: groupId });
    
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

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
      mongodb: !!mongoClient,
      blockchain: !!contract,
    },
  })
})

/**
 * Store Group Data in MongoDB
 */
app.post("/api/groups/store", async (req, res) => {
  try {
    const { groupId, groupData } = req.body

    if (!groupId || !groupData) {
      return res.status(400).json({ error: "Group ID and data are required" })
    }

    // Prepare metadata
    const metadata = {
      groupId,
      ...groupData,
      inviteCode: generateInviteCode(), // Generate invite code
      createdAt: new Date().toISOString(),
      objectId: generateObjectId(),
      version: "1.0",
    }

    // Generate metadata hash
    const metadataString = JSON.stringify(metadata, Object.keys(metadata).sort())
    const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex')

    // Add metadata hash to the data
    metadata.mongodb = {
      documentId: groupId,
      collection: MONGODB_CONFIG.collections.groups,
      metadataHash: metadataHash,
      lastUpdated: new Date().toISOString()
    }

    // Store in MongoDB
    const { db } = await connectToMongoDB();
    await db.collection(MONGODB_CONFIG.collections.groups).updateOne(
      { id: groupId },
      { $set: metadata },
      { upsert: true }
    );

    console.log("✅ Group data stored in MongoDB:", groupId);

    res.json({
      success: true,
      objectId: metadata.objectId,
      metadataHash,
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
 * Get All Groups from MongoDB
 */
app.get("/api/groups", async (req, res) => {
  try {
    // Get all groups from MongoDB
    const { db } = await connectToMongoDB();
    const groups = await db.collection(MONGODB_CONFIG.collections.groups).find({}).toArray();

    console.log("✅ Retrieved all groups:", groups.length);

    res.json({
      success: true,
      groups,
      count: groups.length,
    })
  } catch (error) {
    console.error("❌ Error retrieving groups:", error)
    res.status(500).json({
      error: "Failed to retrieve groups",
      details: error.message,
    })
  }
})

/**
 * Get Group by ID from MongoDB
 */
app.get("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params

    // Get group from MongoDB
    const { db } = await connectToMongoDB();
    const group = await db.collection(MONGODB_CONFIG.collections.groups).findOne({ id: groupId });

    if (!group) {
      return res.status(404).json({ error: "Group not found" })
    }

    console.log("✅ Retrieved group:", groupId);

    res.json({
      success: true,
      group,
    })
  } catch (error) {
    console.error("❌ Error retrieving group:", error)
    res.status(500).json({
      error: "Failed to retrieve group",
      details: error.message,
    })
  }
})

/**
 * Store Invite in MongoDB
 */
app.post("/api/invites/store", async (req, res) => {
  try {
    const { groupId, invite } = req.body

    if (!groupId || !invite) {
      return res.status(400).json({ error: "Group ID and invite data are required" })
    }

    // Generate a unique ID for the invite
    const newInvite = {
      ...invite,
      id: generateObjectId(),
      createdAt: new Date().toISOString(),
    }

    // Get existing invites from MongoDB
    const { db } = await connectToMongoDB();
    const invitesCollection = db.collection(MONGODB_CONFIG.collections.invites);
    
    // Store the invite in MongoDB
    await invitesCollection.insertOne({
      groupId,
      ...newInvite,
      mongodb: {
        documentId: newInvite.id,
        collection: MONGODB_CONFIG.collections.invites,
        lastUpdated: new Date().toISOString()
      }
    });

    // Get count of invites for this group
    const inviteCount = await invitesCollection.countDocuments({ groupId });

    console.log("✅ Invite stored in MongoDB:", newInvite.id);

    res.json({
      success: true,
      inviteId: newInvite.id,
      totalInvites: inviteCount,
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
 * Get Group Invites from MongoDB
 */
app.get("/api/invites/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params
    
    // Get invites from MongoDB
    const { db } = await connectToMongoDB();
    const invites = await db.collection(MONGODB_CONFIG.collections.invites)
      .find({ groupId })
      .toArray();

    res.json({
      success: true,
      groupId,
      invites,
      count: invites.length,
    })
  } catch (error) {
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

    if (!groupId || isNaN(Number(groupId))) {
      return res.status(400).json({ error: "Valid group ID is required" })
    }

    const groupData = await contract.getGroup(groupId)

    // Format the response
    const formattedGroup = {
      id: groupData[0].toString(),
      creator: groupData[1],
      name: groupData[2],
      description: groupData[3],
      contributionAmount: ethers.formatEther(groupData[4]),
      currentAmount: ethers.formatEther(groupData[5]),
      targetAmount: ethers.formatEther(groupData[6]),
      startDate: new Date(Number(groupData[7]) * 1000).toISOString(),
      endDate: new Date(Number(groupData[8]) * 1000).toISOString(),
      status: Number(groupData[9]),
      isActive: groupData[10],
      memberCount: groupData[11].toString(),
      metadataURI: groupData[12],
    }

    res.json({
      success: true,
      group: formattedGroup,
    })
  } catch (error) {
    console.error("❌ Error getting blockchain group data:", error)
    res.status(500).json({
      error: "Failed to get blockchain group data",
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
 * Upload File to MongoDB
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

    // Store file metadata in MongoDB
    const { db } = await connectToMongoDB();
    await db.collection(MONGODB_CONFIG.collections.uploads).insertOne({
      id: objectId,
      name: sanitizedName,
      originalName: originalname,
      objectName,
      contentType: mimetype,
      size: buffer.length,
      createdAt: new Date().toISOString(),
      data: buffer.toString('base64'), // Store file as base64 string
      mongodb: {
        documentId: objectId,
        collection: MONGODB_CONFIG.collections.uploads,
        lastUpdated: new Date().toISOString()
      }
    });

    console.log("✅ File uploaded to MongoDB:", objectName);

    res.json({
      success: true,
      fileId: objectId,
      fileName: sanitizedName,
      objectName,
      contentType: mimetype,
      size: buffer.length,
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
 * Get File from MongoDB
 */
app.get("/api/files/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params

    // Get file from MongoDB
    const { db } = await connectToMongoDB();
    const file = await db.collection(MONGODB_CONFIG.collections.uploads).findOne({ id: fileId });

    if (!file) {
      return res.status(404).json({ error: "File not found" })
    }

    // Convert base64 back to buffer
    const fileBuffer = Buffer.from(file.data, 'base64');

    // Set content type header
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
    
    // Send the file
    res.send(fileBuffer);
  } catch (error) {
    console.error("❌ Error retrieving file:", error)
    res.status(500).json({
      error: "Failed to retrieve file",
      details: error.message,
    })
  }
})

// Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err)
  res.status(500).json({
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" })
})

// Initialize and start server
async function startServer() {
  try {
    await connectToMongoDB()

    app.listen(PORT, () => {
      console.log(`🚀 Concordia Backend Server running on port ${PORT}`)
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`)
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
  if (mongoClient) {
    mongoClient.close()
  }
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully")
  if (mongoClient) {
    mongoClient.close()
  }
  process.exit(0)
})
