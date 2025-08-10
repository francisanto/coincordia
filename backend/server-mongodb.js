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

// Smart Contract Configuration
const CONTRACT_CONFIG = {
  address: process.env.CONTRACT_ADDRESS || "0x1234567890123456789012345678901234567890",
  abi: [
    // Add your contract ABI here
    "function createGroup(string,string,uint256,uint256,uint256,uint8) external payable returns (uint256)",
    "function contribute(uint256) external payable",
    "function joinGroup(uint256) external payable",
    "function getGroup(uint256) external view returns (tuple(uint256,address,string,string,uint256,uint256,uint256,uint256,uint256,uint8,bool,uint256))",
    "function getGroupMembers(uint256) external view returns (address[])",
    "function getMemberDetails(uint256,address) external view returns (tuple(address,uint256,uint256,uint256,bool))",
    "function getUserGroups(address) external view returns (uint256[])",
    "event GroupCreated(uint256 indexed,address indexed,string,uint256,uint256)",
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

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    // Check database connection
    const dbStatus = await connectDB();
    
    // Check if server is responding
    const serverStatus = true;
    
    // Check if required environment variables are set
    const envCheck = {
      mongodb: !!process.env.MONGODB_URI,
      port: !!process.env.PORT,
      contract: !!process.env.CONTRACT_ADDRESS,
      rpc: !!process.env.RPC_URL
    };
    
    const allEnvSet = Object.values(envCheck).every(Boolean);
    
    if (dbStatus && serverStatus && allEnvSet) {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        database: "connected",
        server: "running",
        environment: process.env.NODE_ENV || "development",
        port: process.env.PORT || 3002,
        envCheck: envCheck
      });
    } else {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        database: dbStatus ? "connected" : "disconnected",
        server: serverStatus ? "running" : "error",
        environment: process.env.NODE_ENV || "development",
        envCheck: envCheck,
        issues: {
          database: !dbStatus ? "Database connection failed" : null,
          environment: !allEnvSet ? "Missing required environment variables" : null
        }
      });
    }
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      database: "error",
      server: "error"
    });
  }
});

// Additional health check for Railway
app.get("/", (req, res) => {
  res.json({
    status: "Concordia Backend API is running",
    timestamp: new Date().toISOString(),
    health: "/health",
    docs: "API endpoints available"
  });
});

// API Routes

// Get all groups for a user
app.get("/api/groups", async (req, res) => {
  try {
    const { address } = req.query;
    const { admin_key } = req.query;
    
    if (!address && !admin_key) {
      return res.status(400).json({ success: false, error: "Address or admin key required" });
    }
    
    let groups;
    
    if (admin_key && admin_key === process.env.ADMIN_API_KEY) {
      // Admin access - get all groups
      groups = await Group.find({}).sort({ createdAt: -1 });
    } else {
      // User access - get only groups they're a member of
      groups = await Group.find({
        "members.address": address.toLowerCase()
      }).sort({ createdAt: -1 });
    }
    
    res.json({
      success: true,
      groups: groups
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch groups"
    });
  }
});

// Create a new group
app.post("/api/groups", async (req, res) => {
  try {
    const { groupData } = req.body;
    const userAddress = req.headers['user-address'];
    
    if (!userAddress) {
      return res.status(401).json({ success: false, error: "User address required" });
    }
    
    if (!groupData) {
      return res.status(400).json({ success: false, error: "Group data required" });
    }
    
    // Create new group
    const newGroup = new Group({
      groupId: groupData.groupId,
      name: groupData.name,
      description: groupData.description,
      goalAmount: groupData.goalAmount,
      duration: groupData.duration,
      withdrawalDate: groupData.withdrawalDate,
      dueDay: groupData.dueDay,
      creator: userAddress,
      members: [{
        address: userAddress,
        nickname: groupData.creatorNickname || "Creator",
        joinedAt: new Date(),
        role: "creator",
        contribution: 0,
        auraPoints: 0,
        hasVoted: false,
        status: "active"
      }],
      currentAmount: 0,
      totalContributions: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newGroup.save();
    
    console.log("✅ Group created in MongoDB:", newGroup.groupId);
    
    res.json({
      success: true,
      group: newGroup
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create group"
    });
  }
});

// Get a specific group
app.get("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const userAddress = req.headers['user-address'];
    
    if (!userAddress) {
      return res.status(401).json({ success: false, error: "User address required" });
    }
    
    const group = await Group.findOne({ groupId });
    
    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }
    
    // Check if user is a member
    const isMember = group.members.some(member => member.address === userAddress);
    
    if (!isMember) {
      return res.status(403).json({ success: false, error: "Access denied" });
    }
    
    res.json({
      success: true,
      group: group
    });
  } catch (error) {
    console.error("Error fetching group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch group"
    });
  }
});

// Update a group
app.put("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { groupData } = req.body;
    const userAddress = req.headers['user-address'];
    
    if (!userAddress) {
      return res.status(401).json({ success: false, error: "User address required" });
    }
    
    const group = await Group.findOne({ groupId });
    
    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }
    
    // Check if user is creator
    if (group.creator !== userAddress) {
      return res.status(403).json({ success: false, error: "Only creator can update group" });
    }
    
    // Update group
    const updatedGroup = await Group.findOneAndUpdate(
      { groupId },
      { 
        ...groupData,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    res.json({
      success: true,
      group: updatedGroup
    });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update group"
    });
  }
});

// Delete a group
app.delete("/api/groups/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const userAddress = req.headers['user-address'];
    
    if (!userAddress) {
      return res.status(401).json({ success: false, error: "User address required" });
    }
    
    const group = await Group.findOne({ groupId });
    
    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }
    
    // Check if user is creator
    if (group.creator !== userAddress) {
      return res.status(403).json({ success: false, error: "Only creator can delete group" });
    }
    
    await Group.deleteOne({ groupId });
    
    console.log("✅ Group deleted from MongoDB:", groupId);
    
    res.json({
      success: true,
      message: "Group deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete group"
    });
  }
});

// Join a group
app.post("/api/groups/join", async (req, res) => {
  try {
    const { inviteCode, userAddress, nickname } = req.body;
    
    if (!inviteCode || !userAddress) {
      return res.status(400).json({ success: false, error: "Invite code and user address are required" });
    }
    
    // Find invite
    const invite = await Invite.findOne({ inviteCode });
    
    if (!invite) {
      return res.status(404).json({ success: false, error: "Invalid invite code" });
    }
    
    if (invite.isUsed) {
      return res.status(400).json({ success: false, error: "Invite code already used" });
    }
    
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: "Invite code expired" });
    }
    
    // Find group
    const group = await Group.findOne({ groupId: invite.groupId });
    
    if (!group) {
      return res.status(404).json({ success: false, error: "Group not found" });
    }
    
    // Check if user is already a member
    const isMember = group.members.some(member => member.address === userAddress);
    
    if (isMember) {
      return res.status(400).json({ success: false, error: "Already a member of this group" });
    }
    
    // Add user to group
    const newMember = {
      address: userAddress,
      nickname: nickname || '',
      joinedAt: new Date(),
      role: 'member',
      contribution: 0,
      auraPoints: 0,
      hasVoted: false,
      status: 'active'
    };
    
    await Group.findOneAndUpdate(
      { groupId: invite.groupId },
      { 
        $push: { members: newMember },
        updatedAt: new Date()
      }
    );
    
    // Mark invite as used
    await Invite.findOneAndUpdate(
      { inviteCode },
      {
        isUsed: true,
        usedBy: userAddress,
        usedAt: new Date()
      }
    );
    
    console.log("✅ User joined group:", userAddress, "->", invite.groupId);
    
    res.json({
      success: true,
      message: "Successfully joined the group",
      data: {
        groupId: invite.groupId,
        groupName: group.name
      }
    });
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({
      success: false,
      error: "Failed to join group"
    });
  }
});

// Check group access
app.get("/api/groups/:groupId/access", async (req, res) => {
  try {
    const { groupId } = req.params;
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({ success: false, error: "Address required" });
    }
    
    const group = await Group.findOne({ groupId });
    
    if (!group) {
      return res.json({
        success: true,
        canRead: false,
        canWrite: false,
        reason: "Group not found"
      });
    }
    
    // Check if user is a member
    const member = group.members.find(m => m.address === address);
    
    if (!member) {
      return res.json({
        success: true,
        canRead: false,
        canWrite: false,
        reason: "Not a member"
      });
    }
    
    const canWrite = member.role === "creator" || member.role === "admin";
    
    res.json({
      success: true,
      canRead: true,
      canWrite: canWrite,
      role: member.role
    });
  } catch (error) {
    console.error("Error checking access:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check access"
    });
  }
});

// Admin routes
app.get("/api/admin/groups", async (req, res) => {
  try {
    const adminKey = req.headers['admin-key'];
    
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ success: false, error: "Invalid admin key" });
    }
    
    const groups = await Group.find({}).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      groups: groups
    });
  } catch (error) {
    console.error("Error fetching admin groups:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch groups"
    });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const adminKey = req.headers['admin-key'];
    
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ success: false, error: "Invalid admin key" });
    }
    
    const users = await User.find({}).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error("Error fetching admin users:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch users"
    });
  }
});

app.get("/api/admin/stats", async (req, res) => {
  try {
    const adminKey = req.headers['admin-key'];
    
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ success: false, error: "Invalid admin key" });
    }
    
    const totalGroups = await Group.countDocuments({});
    const totalUsers = await User.countDocuments({});
    const activeGroups = await Group.countDocuments({ isActive: true });
    
    res.json({
      success: true,
      stats: {
        totalGroups,
        totalUsers,
        activeGroups,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch stats"
    });
  }
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
