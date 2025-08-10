const mongoose = require('mongoose');

const bucketSchema = new mongoose.Schema({
  bucketId: { type: String, required: true, unique: true },
  bucketName: { type: String, required: true, unique: true },
  groupId: { type: String, required: true },
  creator: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  permissions: {
    creator: { type: String, required: true },
    members: [{ type: String }]
  }
});

// Indexes for faster queries
bucketSchema.index({ bucketId: 1 }, { unique: true });
bucketSchema.index({ bucketName: 1 }, { unique: true });
bucketSchema.index({ groupId: 1 });

module.exports = mongoose.model('Bucket', bucketSchema);