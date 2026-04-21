const User = require("../models/User");
const Payment = require("../models/Payment");
const AiPsychic = require("../models/aiPsychic");

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPsychics = await AiPsychic.countDocuments();

    // Total revenue
    const totalAmountAgg = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, totalAmount: { $sum: "$amount" } } }
    ]);
    const totalAmount = totalAmountAgg.length > 0 ? totalAmountAgg[0].totalAmount : 0;

    // Monthly revenue
    const paymentsByMonth = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } }, revenue: { $sum: "$amount" } } },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalPsychics,
        totalAmount,
        monthlyRevenue: paymentsByMonth
      }
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
