const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
  objectId: {
    type: String,
    required: true,
    unique: true
  },
  objectName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  uploadedBy: {
    type: String,
    default: ''
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  url: {
    type: String,
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  }
});

module.exports = mongoose.model('File', FileSchema);