const express = require("express")
const cors = require("cors")
const { ethers } = require("ethers")
const multer = require("multer")
const crypto = require("crypto")
const path = require("path")
const fs = require("fs")
require("dotenv").config()
const nodemailer = require("nodemailer");
const { OpenAI } = require("openai");
const mongoose = require('mongoose');
const connectDB = require('./config/database');

const app = express()
const PORT = process.env.PORT || 3002

// Log environment variables for debugging (excluding sensitive data)
console.log('Environment Configuration:')
console.log('- NODE_ENV:', process.env.NODE_ENV)
console.log('- PORT:', PORT)
console.log('- CONTRACT_ADDRESS:', process.env.CONTRACT_ADDRESS)
console.log('- RPC_URL:', process.env.RPC_URL)
console.log('- NETWORK:', process.env.NETWORK)
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set (hidden)' : 'Not set')
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL)

// Connect to MongoDB
let mongoConnected = false;
connectDB().then(connection => {
  if (connection) {
    mongoConnected = true;
    console.log('MongoDB connection established');
  } else {
    console.log('MongoDB connection failed, will use fallback storage');
  }
});

// Import models
const Group = require('./models/Group');

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://concordia-production.up.railway.app",
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
})

// Admin Configuration
const ADMIN_CONFIG = {
  adminAddress: process.env.ADMIN_ADDRESS || "0x0000000000000000000000000000000000000000", // Admin wallet address for access control
}

// Initialize MongoDB connection status
let mongoDbStatus = {
  connected: false,
  lastCheck: null,
  error: null
};

// Function to check MongoDB connection status
async function checkMongoDBStatus() {
  try {
    if (mongoose.connection.readyState === 1) {
      mongoDbStatus.connected = true;
      mongoDbStatus.lastCheck = new Date();
      mongoDbStatus.error = null;
      return true;
    } else {
      mongoDbStatus.connected = false;
      mongoDbStatus.lastCheck = new Date();
      mongoDbStatus.error = "Connection not established";
      return false;
    }
  } catch (error) {
    mongoDbStatus.connected = false;
    mongoDbStatus.lastCheck = new Date();
    mongoDbStatus.error = error.message;
    console.error("❌ Error checking MongoDB connection:", error);
    return false;
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
    const group = await Group.findOne({ groupId });
    
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
 * Health Check with MongoDB status
 */
app.get("/api/health", async (req, res) => {
  // Check MongoDB status
  await checkMongoDBStatus();
  
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    services: {
      mongodb: mongoConnected ? "connected" : "disconnected",
      mongodb_details: mongoDbStatus,
      blockchain: !!contract
    }
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

    // Generate invite code if not provided
    const inviteCode = groupData.inviteCode || generateInviteCode();
    const objectId = generateObjectId();
    
    // Prepare metadata
    const metadata = {
      groupId,
      ...groupData,
      inviteCode,
      createdAt: new Date().toISOString(),
      objectId,
      version: "1.0",
    }

    // Generate metadata hash for integrity verification
    const metadataString = JSON.stringify(metadata, Object.keys(metadata).sort())
    const metadataHash = crypto.createHash('sha256').update(metadataString).digest('hex')
    metadata.metadataHash = metadataHash;

    let mongoResult = null;
    
    // Check MongoDB connection status
    await checkMongoDBStatus();
    
    // Store in MongoDB
    try {
      // Check if group already exists
      let group = await Group.findOne({ groupId });
      
      if (group) {
        // Update existing group
        Object.assign(group, metadata);
        mongoResult = await group.save();
        console.log("✅ Group data updated in MongoDB:", groupId);
      } else {
        // Create new group
        const newGroup = new Group(metadata);
        mongoResult = await newGroup.save();
        console.log("✅ Group data stored in MongoDB:", groupId);
      }
      
      return res.status(200).json({
        success: true,
        message: group ? "Group updated successfully" : "Group created successfully",
        groupId,
        inviteCode: metadata.inviteCode,
        metadataHash
      });
    } catch (mongoError) {
      console.error("❌ Error storing group data in MongoDB:", mongoError);
      return res.status(500).json({
        success: false,
        error: "Failed to store group data",
        details: mongoError.message
      });
    }
    
    res.json({
      success: true,
      objectId,
      metadataHash,
      metadata,
      storage: "mongodb"
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
    // Check MongoDB connection status
    const mongoStatus = await checkMongoDBStatus();
    if (!mongoStatus.connected) {
      return res.status(503).json({ 
        error: "Database unavailable", 
        details: "MongoDB connection is not available" 
      });
    }
    
    // Get all groups from MongoDB
    try {
      const groups = await Group.find({}).lean();
      console.log("✅ Retrieved all groups from MongoDB:", groups.length);
      
      res.json({
        success: true,
      groups,
      source: "mongodb"
    });
  } catch (error) {
    console.error("❌ Error retrieving all groups:", error);
    res.status(500).json({
      error: "Failed to retrieve groups",
      details: error.message,
    });
  }
})

/**
 * Retrieve Group Data from MongoDB with Greenfield fallback
 */
app.get("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check MongoDB connection status
    const mongoStatus = await checkMongoDBStatus();
    if (!mongoStatus.connected) {
      return res.status(503).json({ 
        error: "Database unavailable", 
        details: "MongoDB connection is not available" 
      });
    }
    
    // Get group from MongoDB
    try {
      const group = await Group.findOne({ groupId }).lean();
      if (group) {
        console.log(`✅ Retrieved group ${groupId} from MongoDB`);
        return res.json({
          success: true,
          metadata: group,
          source: "mongodb"
        });
      } else {
        return res.status(404).json({ error: "Group not found" });
      }
    } catch (mongoError) {
      console.error(`❌ Error retrieving group ${groupId} from MongoDB:`, mongoError);
      return res.status(500).json({ 
        error: "Database error", 
        details: mongoError.message 
      });
    }
  } catch (error) {
    console.error("❌ Error retrieving group data:", error);
    
    res.status(500).json({
      error: "Failed to retrieve group data",
      details: error.message,
    });
  }
})

/**
 * Find Group by Invite Code using MongoDB
 */
app.get("/api/groups/code/:code", async (req, res) => {
  try {
    const { code } = req.params;
    
    // Check MongoDB connection status
    const mongoStatus = await checkMongoDBStatus();
    if (!mongoStatus.connected) {
      return res.status(503).json({ 
        error: "Database unavailable", 
        details: "MongoDB connection is not available" 
      });
    }
    
    // Find group by invite code in MongoDB
    try {
      let group = await Group.findOne({ inviteCode: code }).lean();
      if (!group) {
        // Try alternative field name
        group = await Group.findOne({ code: code }).lean();
      }
        
        if (group) {
          console.log(`✅ Found group by code ${code} in MongoDB`);
          return res.json({
            success: true,
            groupId: group.groupId || group.id,
            group,
            source: "mongodb"
          });
        } else {
          return res.status(404).json({ error: "Group not found with this invite code" });
        }
      } catch (mongoError) {
        console.error(`❌ Error finding group by code ${code} in MongoDB:`, mongoError);
        return res.status(500).json({
          error: "Database error",
          details: mongoError.message
        });
      }
  } catch (error) {
    console.error("❌ Error in /api/groups/code/:code endpoint:", error);
    res.status(500).json({
      error: "Failed to find group by code",
      details: error.message,
    });
  }
})

/**
 * Update Group Data in MongoDB
 */
app.put("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { updateData } = req.body;

    // Check MongoDB connection status
    const mongoStatus = await checkMongoDBStatus();
    if (!mongoStatus.connected) {
      return res.status(503).json({ 
        error: "Database unavailable", 
        details: "MongoDB connection is not available" 
      });
    }
    
    // Find and update the group in MongoDB
    try {
      // Find the existing group
      const existingGroup = await Group.findOne({ groupId });
      
      if (!existingGroup) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Merge with update data
      const updatedMetadata = {
        ...updateData,
        updatedAt: new Date().toISOString(),
        version: (Number.parseFloat(existingGroup.version || "1.0") + 0.1).toFixed(1),
    }

    // Update the group in MongoDB
    const updatedGroup = await Group.findOneAndUpdate(
      { groupId },
      updatedMetadata,
      { new: true }
    );

    console.log("✅ Group data updated in MongoDB:", groupId);

    res.json({
      success: true,
      groupId,
      metadata: updatedGroup,
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
 * Delete Group Data from MongoDB
 */
app.delete("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check MongoDB connection status
    const mongoStatus = await checkMongoDBStatus();
    if (!mongoStatus.connected) {
      return res.status(503).json({ 
        error: "Database unavailable", 
        details: "MongoDB connection is not available" 
      });
    }
    
    // Delete the group from MongoDB
    const deleteResult = await Group.deleteOne({ groupId });
    
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: "Group not found" });
    }
    
    console.log("✅ Group data deleted from MongoDB:", groupId);
    
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
 * Store Contribution Data in MongoDB
 */
app.post("/api/contributions/store", async (req, res) => {
  try {
    const { groupId, contributionData } = req.body;
    
    // Check MongoDB connection status
    const mongoStatus = await checkMongoDBStatus();
    if (!mongoStatus.connected) {
      return res.status(503).json({ 
        error: "Database unavailable", 
        details: "MongoDB connection is not available" 
      });
    }
    
    // Import the Contribution model
    const Contribution = require('./models/Contribution');
    
    // Create new contribution
    const newContribution = new Contribution({
      ...contributionData,
      groupId,
      id: generateObjectId(),
      timestamp: new Date()
    });
    
    // Save to MongoDB
    await newContribution.save();
    
    // Get total contributions count for this group
    const totalContributions = await Contribution.countDocuments({ groupId });
    
    console.log(`✅ Contribution stored in MongoDB for group ${groupId}`);
    
    res.json({
      success: true,
      contributionId: newContribution.id,
      totalContributions,
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
 * Get Group Contributions from MongoDB
 */
app.get("/api/contributions/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Check MongoDB connection status
    const mongoStatus = await checkMongoDBStatus();
    if (!mongoStatus.connected) {
      return res.status(503).json({ 
        error: "Database unavailable", 
        details: "MongoDB connection is not available" 
      });
    }
    
    // Import the Contribution model
    const Contribution = require('./models/Contribution');
    
    // Get contributions from MongoDB
    const contributions = await Contribution.find({ groupId }).sort({ timestamp: -1 }).lean();
    
    console.log(`✅ Retrieved ${contributions.length} contributions for group ${groupId} from MongoDB`);
    
    res.json({
      success: true,
      groupId,
      contributions,
      count: contributions.length,
    });
  } catch (error) {
    console.error("❌ Error retrieving contributions:", error);
    res.status(500).json({
      error: "Failed to retrieve contributions",
      details: error.message,
    });
  }
})

/**
 * Store Member Invites in MongoDB
 */
app.post("/api/invites/store", async (req, res) => {
  try {
    const { groupId, inviteData } = req.body;
    
    // Check MongoDB connection status
    const mongoStatus = await checkMongoDBStatus();
    if (!mongoStatus.connected) {
      return res.status(503).json({ 
        error: "Database unavailable", 
        details: "MongoDB connection is not available" 
      });
    }
    
    // Import the Invite model
    const Invite = require('./models/Invite');
    
    // Create new invite
    const newInvite = new Invite({
      ...inviteData,
      groupId,
      id: generateObjectId(),
      createdAt: new Date()
    });
    
    // Save to MongoDB
    await newInvite.save();
    
    // Get total invites count for this group
    const totalInvites = await Invite.countDocuments({ groupId });
    
    console.log(`✅ Invite stored in MongoDB for group ${groupId}`)

    res.json({
      success: true,
      inviteId: newInvite.id,
      storage: "mongodb",
      totalInvites: totalInvites,
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
    
    // Check MongoDB connection status
    const mongoStatus = await checkMongoDBStatus();
    if (!mongoStatus.connected) {
      return res.status(503).json({ 
        error: "Database unavailable", 
        details: "MongoDB connection is not available" 
      });
    }
    
    // Import the Invite model
    const Invite = require('./models/Invite');

    // Get invites from MongoDB
    const invites = await Invite.find({ groupId }).sort({ createdAt: -1 }).lean();
    
    console.log(`✅ Retrieved ${invites.length} invites for group ${groupId} from MongoDB`);
    
    res.json({
      success: true,
      groupId,
      invites,
      count: invites.length,
      source: "mongodb"
    });
  } catch (error) {
    console.error("❌ Error retrieving invites:", error);
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
 * Upload File to MongoDB and Local Storage
 */
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    // Check MongoDB connection status
    const mongoStatus = await checkMongoDBStatus();
    if (!mongoStatus.connected) {
      return res.status(503).json({ 
        error: "Database unavailable", 
        details: "MongoDB connection is not available" 
      });
    }
    
    const { originalname, buffer, mimetype } = req.file
    const sanitizedName = sanitizeFileName(originalname)
    const objectId = generateObjectId()
    const timestamp = Date.now()
    const objectName = `uploads/${timestamp}_${sanitizedName}`
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save file to local filesystem
    const filePath = path.join(uploadsDir, `${timestamp}_${sanitizedName}`);
    fs.writeFileSync(filePath, buffer);
    
    // Generate URL for the file
    const fileUrl = `/uploads/${timestamp}_${sanitizedName}`;
    
    // Import the File model
    const File = require('./models/File');
    
    // Create file record in MongoDB
    const fileRecord = new File({
      objectId,
      objectName,
      originalName: originalname,
      size: buffer.length,
      contentType: mimetype,
      uploadedAt: new Date(),
      url: fileUrl
    });
    
    // Save to MongoDB
    await fileRecord.save();
    
    console.log("✅ File uploaded to local storage and MongoDB:", objectName)

    res.json({
      success: true,
      objectId,
      objectName,
      originalName: originalname,
      size: buffer.length,
      contentType: mimetype,
      storage: "mongodb",
      url: fileUrl,
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
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/concordia');
    console.log('✅ Connected to MongoDB');

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
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully")
  process.exit(0)
})
