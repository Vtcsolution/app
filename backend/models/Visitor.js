const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  sessionId: { type: String, required: true }, // Required for unique session tracking
  browser: String,
  browserVersion: String,
  os: String,
  osVersion: String,
  device: String,
  ip: String,
  path: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Visitor', visitorSchema);