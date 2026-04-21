// models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
  },
  message: { type: String, required: true, trim: true },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "UserReportModal", // Reference to UserReportModal
    default: null 
  },
  replied: { 
    type: Boolean, 
    default: false 
  },
  repliedAt: { 
    type: Date 
  },
  replyContent: { 
    type: String 
  },
  replySubject: { 
    type: String 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);