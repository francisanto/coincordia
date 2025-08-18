const mongoose = require('mongoose');

const MemberSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
    lowercase: true
  },
  nickname: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  contributionAmount: {
    type: Number,
    default: 0
  },
  contributionCount: {
    type: Number,
    default: 0
  },
  lastContribution: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const GroupSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  creator: {
    type: String,
    required: true,
    lowercase: true
  },
  contributionAmount: {
    type: Number,
    required: true
  },
  contributionFrequency: {
    type: Number,
    required: true
  },
  totalContributions: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  nextContribution: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true
  },
  members: [MemberSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  metadataHash: String,
  transactionHash: String
});

// Create indexes for faster queries
GroupSchema.index({ creator: 1 });
GroupSchema.index({ inviteCode: 1 });
GroupSchema.index({ 'members.address': 1 });

// Update the updatedAt field on save
GroupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Group', GroupSchema);