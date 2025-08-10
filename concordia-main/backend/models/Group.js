const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  address: { type: String, required: true },
  nickname: { type: String, default: '' },
  joinedAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['creator', 'member'], default: 'member' },
  contribution: { type: Number, default: 0 },
  auraPoints: { type: Number, default: 0 },
  hasVoted: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
});

const contributionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  contributor: { type: String, required: true },
  memberAddress: { type: String },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  auraPoints: { type: Number, default: 0 },
  isEarly: { type: Boolean, default: false },
  transactionHash: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' }
});

const settingsSchema = new mongoose.Schema({
  dueDay: { type: Number, required: true },
  duration: { type: String, required: true },
  withdrawalDate: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  maxMembers: { type: Number, default: 10 }
});

const blockchainSchema = new mongoose.Schema({
  contractAddress: { type: String },
  transactionHash: { type: String },
  blockNumber: { type: String },
  gasUsed: { type: String },
  network: { type: String }
});

const bucketSchema = new mongoose.Schema({
  bucketId: { type: String },
  bucketName: { type: String },
  endpoint: { type: String }
});

const groupSchema = new mongoose.Schema({
  groupId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  creator: { type: String, required: true },
  goalAmount: { type: Number, required: true },
  duration: { type: Number, required: true },
  withdrawalDate: { type: String, required: true },
  dueDay: { type: Number, required: true },
  members: [memberSchema],
  contributions: [contributionSchema],
  settings: settingsSchema,
  blockchain: blockchainSchema,
  bucket: bucketSchema,
  inviteCode: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  version: { type: String, default: '1.0' }
});

// Indexes for faster queries
groupSchema.index({ groupId: 1 }, { unique: true });
groupSchema.index({ creator: 1 });
groupSchema.index({ 'members.address': 1 });

module.exports = mongoose.model('Group', groupSchema);