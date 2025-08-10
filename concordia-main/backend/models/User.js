const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  address: { type: String, required: true, unique: true },
  nickname: { type: String },
  email: { type: String },
  auraPoints: { type: Number, default: 0 },
  groups: [{ type: String }], // Array of groupIds the user belongs to
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

// Indexes for faster queries
userSchema.index({ address: 1 }, { unique: true });
userSchema.index({ groups: 1 });

module.exports = mongoose.model('User', userSchema);