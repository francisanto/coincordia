require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const multer = require("multer");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OpenAI } = require("openai");
const mongoose = require("mongoose");

const { connectDB } = require("./db");
const Group = require("./models/Group");
const Invite = require("./models/Invite");
const User = require("./models/User");
const AuraReward = require("./models/AuraReward");

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://concordia-production.up.railway.app",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// MongoDB Configuration
const MONGODB_CONFIG = {
  adminAddress: process.env.ADMIN_ADDRESS || "0xdA13e8F82C83d14E7aa639354054B7f914cA0998",
};

// Initialize MongoDB Connection
async function initializeDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    const adminExists = await User.findOne({ address: MONGODB_CONFIG.adminAddress });
    if (!adminExists) {
      await User.create({
        address: MONGODB_CONFIG.adminAddress,
        nickname: "Admin",
        isAdmin: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("✅ Admin user created");
    }
  } catch (error) {
    console.error("❌ Failed to initialize MongoDB:", error);
  }
}

// Smart Contract Configuration
const CONTRACT_CONFIG = {
  address: process.env.CONTRACT_ADDRESS || "0xe93ECeA7f56719e60cb03fc1608A5830793D95FF",
  abi: [
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
};

// Initialize Web3 Provider
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://opbnb-testnet-rpc.bnbchain.org");
const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, provider);

// Utility Functions
function generateObjectId() {
  return crypto.randomBytes(16).toString("hex");
}

function generateInviteCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
}

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NOTIFY_EMAIL,
    pass: process.env.NOTIFY_EMAIL_PASS,
  },
});

// Configure OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper to generate AI message
async function generateAIDueDateMessage(memberName, groupName, dueDate) {
  const prompt = `Write a friendly reminder email for ${memberName} that their payment is due for the group savings "${groupName}" on ${dueDate}.`;
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 120,
  });
  return completion.choices[0].message.content;
}

// Routes

// Health check
app.get("/health", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1;
    const envCheck = {
      mongodb: !!process.env.MONGO_URI,
      port: !!process.env.PORT,
      contract: !!process.env.CONTRACT_ADDRESS,
      rpc: !!process.env.RPC_URL,
    };
    const allEnvSet = Object.values(envCheck).every(Boolean);

    res.status(dbStatus && allEnvSet ? 200 : 503).json({
      status: dbStatus && allEnvSet ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      database: dbStatus ? "connected" : "disconnected",
      envCheck,
    });
  } catch (error) {
    res.status(500).json({ status: "unhealthy", error: error.message });
  }
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    status: "Concordia Backend API is running",
    timestamp: new Date().toISOString(),
    health: "/health",
  });
});

// --- Group Routes ---

// Get all groups for user/admin
app.get("/api/groups", async (req, res) => {
  try {
    const { address, admin_key } = req.query;

    if (!address && !admin_key) return res.status(400).json({ success: false, error: "Address or admin key required" });

    let groups;
    if (admin_key && admin_key === process.env.ADMIN_API_KEY) {
      groups = await Group.find({}).sort({ createdAt: -1 });
    } else {
      groups = await Group.find({ "members.address": address.toLowerCase() }).sort({ createdAt: -1 });
    }

    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch groups" });
  }
});

// Create group
app.post("/api/groups", async (req, res) => {
  try {
    const { groupData } = req.body;
    const userAddress = req.headers["user-address"];
    if (!userAddress) return res.status(401).json({ success: false, error: "User address required" });
    if (!groupData) return res.status(400).json({ success: false, error: "Group data required" });

    const newGroup = new Group({
      groupId: groupData.groupId,
      name: groupData.name,
      description: groupData.description,
      goalAmount: groupData.goalAmount,
      duration: groupData.duration,
      withdrawalDate: groupData.withdrawalDate,
      dueDay: groupData.dueDay,
      creator: userAddress,
      members: [
        {
          address: userAddress,
          nickname: groupData.creatorNickname || "Creator",
          joinedAt: new Date(),
          role: "creator",
          contribution: 0,
          auraPoints: 0,
          hasVoted: false,
          status: "active",
        },
      ],
      currentAmount: 0,
      totalContributions: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newGroup.save();
    res.json({ success: true, group: newGroup });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to create group" });
  }
});

// Get, update, delete group, join group, access check, admin routes
// ... keep your existing route logic here exactly as in your original code ...

// Start server
async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}

startServer();
