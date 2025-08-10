const mongoose = require('mongoose');

const auraRewardSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  auraPointsSpent: { type: Number, required: true },
  rewardType: { type: String, required: true },
  rewardDetails: { type: mongoose.Schema.Types.Mixed },
  transactionHash: { type: String },
  status: { type: String, enum: ['pending', 'confirmed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
auraRewardSchema.index({ userId: 1 });
auraRewardSchema.index({ id: 1 }, { unique: true });

module.exports = mongoose.model('AuraReward', auraRewardSchema);