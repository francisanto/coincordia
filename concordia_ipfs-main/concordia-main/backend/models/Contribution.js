const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema({
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
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    default: 0
  },
  contributor: {
    type: String,
    required: true
  },
  contributorNickname: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  metadata: {
    type: Object,
    default: {}
  }
});

module.exports = mongoose.model('Contribution', ContributionSchema);