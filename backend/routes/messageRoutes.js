const express = require("express");
const router = express.Router();
const { 
    sendMessage, 
    getAllMessages, 
    deleteMessage, 
    sendReply,
    quickSendEmail,
    getRepliesStatus
} = require("../controllers/messageController");

// Public route for sending a message
router.post("/contact", sendMessage);
router.get("/replies-status", getRepliesStatus); 
// Admin routes
router.post("/quick-send", quickSendEmail); 
router.get("/", getAllMessages);
router.delete("/:id", deleteMessage);
router.post("/reply", sendReply);

module.exports = router;