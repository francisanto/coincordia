const mongoose = require('mongoose');

const InviteSchema = new mongoose.Schema({
  groupId: {
    type: String,
    required: true,
    index: true
  },
  id: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  inviterAddress: {
    type: String,
    required: true
  },
  inviterNickname: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Object,
    default: {}
  }
});

module.exports = mongoose.model('Invite', InviteSchema);