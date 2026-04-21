
const Feedback = require("../models/Feedback");
const mongoose = require("mongoose");

exports.submitFeedback = async (req, res) => {
  try {
    const { psychicId } = req.params;
    const { rating } = req.body;
    const userId = req.user?._id;

    // Validate inputs
    if (!userId || !psychicId || !mongoose.isValidObjectId(psychicId)) {
      return res.status(400).json({ error: "User ID and valid Psychic ID are required" });
    }

    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be an integer between 1 and 5" });
    }

    // Create feedback
    const feedback = await Feedback.create({
      userId,
      psychicId,
      rating,
    });

    // Emit WebSocket event for feedback submission
    req.io.to(userId.toString()).emit("feedbackSubmitted", {
      userId,
      psychicId,
      rating,
      createdAt: feedback.createdAt,
    });

    res.status(201).json({
      success: true,
      feedback: {
        _id: feedback._id,
        rating: feedback.rating,
        createdAt: feedback.createdAt,
      },
    });
  } catch (error) {
    console.error("Feedback submission error:", error);
    res.status(500).json({
      error: "Failed to submit feedback",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getFeedbackByPsychicId = async (req, res) => {
  try {
    const { psychicId } = req.params;
    const { userId } = req.query;

    if (!psychicId || !mongoose.isValidObjectId(psychicId)) {
      return res.status(400).json({ error: "Valid Psychic ID is required" });
    }

    if (userId && !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: "Valid User ID is required" });
    }

    const query = { psychicId };
    if (userId) {
      query.userId = userId;
    }

    const feedback = await Feedback.find(query)
      .populate("userId", "username profile")
      .select("userId rating message gift createdAt")
      .lean();

    let userFeedback = null;
    let userAverageRating = 0;
    let userFeedbackCount = 0;
    if (userId) {
      if (!feedback || feedback.length === 0) {
        userFeedback = [];
        userAverageRating = 0;
        userFeedbackCount = 0;
      } else {
        userFeedback = feedback.map((fb) => ({
          ...fb,
          userName: fb.userId?.username || "Anonymous",
          profile: fb.userId?.profile || "https://via.placeholder.com/40",
        }));
        const totalUserRatings = feedback.reduce((sum, fb) => sum + fb.rating, 0);
        userFeedbackCount = feedback.length;
        userAverageRating = userFeedbackCount > 0 ? (totalUserRatings / userFeedbackCount).toFixed(2) : 0;
      }
    }

    let overallFeedback = feedback;
    let overallAverageRating = userAverageRating;
    let overallFeedbackCount = userFeedbackCount;
    if (userId) {
      overallFeedback = await Feedback.find({ psychicId })
        .populate("userId", "username profile")
        .select("userId rating message gift createdAt")
        .lean();
      overallFeedback = overallFeedback.map((fb) => ({
        ...fb,
        userName: fb.userId?.username || "Anonymous",
        profile: fb.userId?.profile || "https://via.placeholder.com/40",
      }));
      const totalOverallRatings = overallFeedback.reduce((sum, fb) => sum + fb.rating, 0);
      overallFeedbackCount = overallFeedback.length;
      overallAverageRating = overallFeedbackCount > 0 ? (totalOverallRatings / overallFeedbackCount).toFixed(2) : 0;
    } else {
      overallFeedback = feedback.map((fb) => ({
        ...fb,
        userName: fb.userId?.username || "Anonymous",
        profile: fb.userId?.profile || "https://via.placeholder.com/40",
      }));
    }

    if (!overallFeedback || overallFeedback.length === 0) {
      return res.status(404).json({ error: "No feedback found for this psychic" });
    }

    const response = {
      success: true,
      overall: {
        feedback: overallFeedback,
        averageRating: overallAverageRating,
        feedbackCount: overallFeedbackCount,
      },
    };

    if (userId) {
      response.user = {
        feedback: userFeedback,
        averageRating: userAverageRating,
        feedbackCount: userFeedbackCount,
      };
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching feedback by psychicId:", error);
    res.status(500).json({
      error: "Failed to fetch feedback",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("userId", "username profile")
      .select("userId psychicId rating message gift createdAt")
      .lean();

    console.log("All feedback:", feedback);

    if (!feedback || feedback.length === 0) {
      return res.status(404).json({ error: "No feedback found" });
    }

    const feedbackByPsychic = feedback.reduce((acc, fb) => {
      const psychicId = fb.psychicId.toString();
      if (!acc[psychicId]) {
        acc[psychicId] = { feedback: [], totalRatings: 0, count: 0 };
      }
      acc[psychicId].feedback.push({
        ...fb,
        userName: fb.userId?.username || "Anonymous",
        profile: fb.userId?.profile || "https://via.placeholder.com/40",
      });
      acc[psychicId].totalRatings += fb.rating;
      acc[psychicId].count += 1;
      return acc;
    }, {});

    const feedbackSummary = Object.keys(feedbackByPsychic).map((psychicId) => ({
      psychicId,
      feedback: feedbackByPsychic[psychicId].feedback,
      averageRating: (feedbackByPsychic[psychicId].totalRatings / feedbackByPsychic[psychicId].count).toFixed(2),
      feedbackCount: feedbackByPsychic[psychicId].count,
    }));

    res.status(200).json({
      success: true,
      feedback: feedbackSummary,
      totalFeedbackCount: feedback.length,
    });
  } catch (error) {
    console.error("Error fetching all feedback:", error);
    res.status(500).json({
      error: "Failed to fetch all feedback",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.fetchAllRatings = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query; // Default to page 1, 5 items per page
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch feedback with pagination
    const feedback = await Feedback.find()
      .populate("userId", "username profile")
      .select("userId psychicId rating message createdAt")
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalFeedback = await Feedback.countDocuments();

    if (!feedback || feedback.length === 0) {
      return res.status(404).json({ error: "No feedback found" });
    }

    const formattedFeedback = feedback.map((fb) => ({
      _id: fb._id,
      userId: fb.userId?._id || null,
      userName: fb.userId?.username || "Anonymous",
      profile: fb.userId?.image || "https://via.placeholder.com/40",
      psychicId: fb.psychicId,
      rating: fb.rating,
      message: fb.message || "No comment",
      createdAt: fb.createdAt,
    }));

    res.status(200).json({
      success: true,
      feedback: formattedFeedback,
      totalFeedback: totalFeedback,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalFeedback / parseInt(limit)),
    });
  } catch (error) {
    console.error("Error fetching all ratings:", error);
    res.status(500).json({
      error: "Failed to fetch ratings",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

exports.deleteRatingById = async (req, res) => {
  try {
    const { feedbackId } = req.params;

    if (!feedbackId || !mongoose.isValidObjectId(feedbackId)) {
      return res.status(400).json({ error: "Valid Feedback ID is required" });
    }

    const feedback = await Feedback.findByIdAndDelete(feedbackId);

    if (!feedback) {
      return res.status(404).json({ error: "Feedback not found" });
    }

    // Emit WebSocket event for feedback deletion
    req.io.to(feedback.userId.toString()).emit("feedbackDeleted", {
      feedbackId,
      psychicId: feedback.psychicId,
    });

    res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({
      error: "Failed to delete feedback",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
