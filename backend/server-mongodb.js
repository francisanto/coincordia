require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const multer = require("multer");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OpenAI } = require("openai");
const mongoose = require("mongoose");

const Group = require("./models/Group");
const Invite = require("./models/Invite");
const User = require("./models/User");
const AuraReward = require("./models/AuraReward");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "https://concordia-production.up.railway.app",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// MongoDB admin
const MONGODB_CONFIG = {
  adminAddress:
    process.env.ADMIN_ADDRESS ||
    "0xdA13e8F82C83d14E7aa639354054B7f914cA0998",
};

// Initialize MongoDB
async function initializeDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    const adminExists = await User.findOne({
      address: MONGODB_CONFIG.adminAddress,
    });
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
    process.exit(1); // Exit if DB fails
  }
}

// Healthcheck endpoint
app.get("/health", (req, res) => {
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
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    status: "Concordia Backend API is running",
    timestamp: new Date().toISOString(),
    health: "/health",
  });
});

// --- Your existing group routes ---
// Example: GET /api/groups, POST /api/groups, etc.

// Start server
async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () =>
    console.log(`🚀 Server running on port ${PORT} | Health: /health`)
  );
}

startServer();
