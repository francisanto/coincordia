const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  inviteCode: { type: String, required: true, unique: true },
  groupId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  createdBy: { type: String },
  isUsed: { type: Boolean, default: false },
  usedBy: { type: String },
  usedAt: { type: Date }
});

// Indexes for faster queries
inviteSchema.index({ inviteCode: 1 }, { unique: true });
inviteSchema.index({ groupId: 1 });
inviteSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Invite', inviteSchema);