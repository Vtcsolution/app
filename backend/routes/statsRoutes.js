const express = require("express");
const { getStats } = require("../controllers/statsController");
const { adminProtect } = require("../middleware/adminProtect");

const router = express.Router();

// GET /api/stats
router.get("/",adminProtect, getStats);

module.exports = router;
