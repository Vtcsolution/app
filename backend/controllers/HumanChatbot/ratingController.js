const Rating = require('../../models/HumanChat/Rating');
const Psychic = require('../../models/HumanChat/Psychic');
const User = require('../../models/User');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// @desc    Add or update rating for a psychic
// @route   POST /api/ratings
// @access  Private (User)
const addRating = asyncHandler(async (req, res) => {
  const { psychicId, rating, comment, sessionId } = req.body;
  const userId = req.user._id;

  // Validate inputs
  if (!psychicId || !rating) {
    return res.status(400).json({
      success: false,
      message: 'Psychic ID and rating are required'
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  // Check if psychic exists
  const psychic = await Psychic.findById(psychicId);
  if (!psychic) {
    return res.status(404).json({
      success: false,
      message: 'Psychic not found'
    });
  }

  // Check if user has chatted with this psychic (optional validation)
  // You can add validation here if you want to ensure user has had a session

  try {
    // Check if rating already exists (update) or create new
    const existingRating = await Rating.findOne({
      user: userId,
      psychic: psychicId
    });

    let ratingDoc;
    const isUpdate = !!existingRating;

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.comment = comment || existingRating.comment;
      existingRating.isEdited = true;
      existingRating.editedAt = new Date();
      if (sessionId) existingRating.sessionId = sessionId;
      
      ratingDoc = await existingRating.save();
    } else {
      // Create new rating
      ratingDoc = await Rating.create({
        user: userId,
        psychic: psychicId,
        rating,
        comment,
        sessionId
      });
    }

    // Update psychic's average rating
    const avgRating = await Rating.getAverageRating(psychicId);
    
    // You can store average rating in psychic model if needed
    // psychic.averageRating = avgRating.averageRating;
    // psychic.totalRatings = avgRating.totalRatings;
    // await psychic.save();

    res.status(200).json({
      success: true,
      message: isUpdate ? 'Rating updated successfully' : 'Rating added successfully',
      data: {
        rating: ratingDoc,
        averageRating: avgRating.averageRating,
        totalRatings: avgRating.totalRatings
      }
    });

  } catch (error) {
    console.error('Rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save rating'
    });
  }
});


const getRatingsByPsychic = asyncHandler(async (req, res) => {
  const { psychicId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Validate psychic ID
  if (!mongoose.Types.ObjectId.isValid(psychicId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid psychic ID'
    });
  }

  try {
    // Get ratings with user details
    const ratings = await Rating.getRatingsWithUsers(psychicId, parseInt(limit), skip);
    
    // Get total count
    const totalRatings = await Rating.countDocuments({ psychic: psychicId });
    
    // Get average rating
    const avgRating = await Rating.getAverageRating(psychicId);

    res.status(200).json({
      success: true,
      data: {
        ratings,
        averageRating: avgRating.averageRating,
        totalRatings: avgRating.totalRatings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRatings / parseInt(limit)),
          totalItems: totalRatings,
          hasMore: skip + ratings.length < totalRatings
        }
      }
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings'
    });
  }
});


const getRatingsByUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const ratings = await Rating.find({ user: userId })
      .populate('psychic', 'name image ratePerMin bio')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalRatings = await Rating.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      data: {
        ratings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRatings / parseInt(limit)),
          totalItems: totalRatings,
          hasMore: skip + ratings.length < totalRatings
        }
      }
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user ratings'
    });
  }
});


const getAllRatings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, psychicId, userId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Build filter
  const filter = {};
  if (psychicId) filter.psychic = psychicId;
  if (userId) filter.user = userId;

  try {
    const ratings = await Rating.find(filter)
      .populate('user', 'firstName lastName username')
      .populate('psychic', 'name')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const totalRatings = await Rating.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        ratings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRatings / parseInt(limit)),
          totalItems: totalRatings
        }
      }
    });
  } catch (error) {
    console.error('Get all ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings'
    });
  }
});


const getRatingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid rating ID'
    });
  }

  try {
    const rating = await Rating.findById(id)
      .populate('user', 'firstName lastName username image')
      .populate('psychic', 'name image')
      .lean();

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    res.status(200).json({
      success: true,
      data: rating
    });
  } catch (error) {
    console.error('Get rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rating'
    });
  }
});


const updateRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid rating ID'
    });
  }

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  try {
    const ratingDoc = await Rating.findById(id);
    
    if (!ratingDoc) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Check if user owns this rating
    if (ratingDoc.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this rating'
      });
    }

    // Update rating
    if (rating) ratingDoc.rating = rating;
    if (comment !== undefined) ratingDoc.comment = comment;
    ratingDoc.isEdited = true;
    ratingDoc.editedAt = new Date();
    
    await ratingDoc.save();

    // Update psychic's average rating
    const avgRating = await Rating.getAverageRating(ratingDoc.psychic);

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      data: {
        rating: ratingDoc,
        averageRating: avgRating.averageRating,
        totalRatings: avgRating.totalRatings
      }
    });
  } catch (error) {
    console.error('Update rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rating'
    });
  }
});


const deleteRating = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const isAdmin = req.user.role === 'admin'; // Assuming you have role in user model

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid rating ID'
    });
  }

  try {
    const ratingDoc = await Rating.findById(id);
    
    if (!ratingDoc) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Check if user owns this rating or is admin
    if (ratingDoc.user.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this rating'
      });
    }

    const psychicId = ratingDoc.psychic;
    
    // Delete rating
    await ratingDoc.deleteOne();

    // Update psychic's average rating
    const avgRating = await Rating.getAverageRating(psychicId);

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully',
      data: {
        averageRating: avgRating.averageRating,
        totalRatings: avgRating.totalRatings
      }
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rating'
    });
  }
});


const getPsychicRatingSummary = asyncHandler(async (req, res) => {
  const { psychicId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(psychicId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid psychic ID'
    });
  }

  try {
    // Get average rating and total count
    const avgResult = await Rating.getAverageRating(psychicId);
    
    // Get rating distribution (1-5 stars)
    const distribution = await Rating.aggregate([
      { $match: { psychic: new mongoose.Types.ObjectId(psychicId) } },
      { $group: {
          _id: '$rating',
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Format distribution
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      const found = distribution.find(d => d._id === i);
      ratingDistribution[i] = found ? found.count : 0;
    }

    // Get latest reviews
    const latestReviews = await Rating.getRatingsWithUsers(psychicId, 3, 0);

    res.status(200).json({
      success: true,
      data: {
        averageRating: avgResult.averageRating,
        totalRatings: avgResult.totalRatings,
        ratingDistribution,
        latestReviews
      }
    });
  } catch (error) {
    console.error('Get rating summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rating summary'
    });
  }
});


const checkRatingExists = asyncHandler(async (req, res) => {
  const { psychicId, sessionId } = req.query;
  const userId = req.user._id;

  if (!psychicId) {
    return res.status(400).json({
      success: false,
      message: 'Psychic ID is required'
    });
  }

  try {
    const rating = await Rating.findOne({
      user: userId,
      psychic: psychicId,
      ...(sessionId && { sessionId })
    });

    res.status(200).json({
      success: true,
      hasRated: !!rating,
      existingRating: rating ? {
        rating: rating.rating,
        comment: rating.comment,
        createdAt: rating.createdAt
      } : null
    });
  } catch (error) {
    console.error('Error checking rating:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check rating'
    });
  }
});


// In your ratingController.js - Add these functions

// @desc    Get all ratings with filters (Admin)
// @route   GET /api/ratings/admin/all
// @access  Private (Admin)
const getAllRatingsAdmin = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    psychicId, 
    userId, 
    userName,
    psychicName,
    minRating,
    maxRating,
    startDate,
    endDate,
    hasComment,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Build filter
  const filter = {};
  
  // Rating filter
  const ratingFilter = {};
  if (minRating) ratingFilter.$gte = parseInt(minRating);
  if (maxRating) ratingFilter.$lte = parseInt(maxRating);
  if (Object.keys(ratingFilter).length > 0) {
    filter.rating = ratingFilter;
  }
  
  // Date filter
  const dateFilter = {};
  if (startDate) dateFilter.$gte = new Date(startDate);
  if (endDate) dateFilter.$lte = new Date(endDate);
  if (Object.keys(dateFilter).length > 0) {
    filter.createdAt = dateFilter;
  }
  
  // Comment filter
  if (hasComment === 'true') {
    filter.comment = { $exists: true, $ne: '' };
  } else if (hasComment === 'false') {
    filter.comment = { $in: ['', null, undefined] };
  }

  // Search by psychic or user
  let psychicIds = [];
  let userIds = [];

  try {
    // Search psychic by name if provided
    if (psychicName) {
      const psychics = await Psychic.find({
        name: { $regex: psychicName, $options: 'i' }
      }).select('_id');
      psychicIds = psychics.map(p => p._id);
    }
    
    // Search user by name if provided
    if (userName) {
      const users = await User.find({
        $or: [
          { firstName: { $regex: userName, $options: 'i' } },
          { lastName: { $regex: userName, $options: 'i' } },
          { username: { $regex: userName, $options: 'i' } }
        ]
      }).select('_id');
      userIds = users.map(u => u._id);
    }

    // Add ID filters
    if (psychicId) filter.psychic = psychicId;
    else if (psychicIds.length > 0) filter.psychic = { $in: psychicIds };
    
    if (userId) filter.user = userId;
    else if (userIds.length > 0) filter.user = { $in: userIds };

    // Get ratings with detailed population
    const ratings = await Rating.find(filter)
      .populate({
        path: 'user',
        select: 'firstName lastName username email image phoneNumber',
        model: 'User'
      })
      .populate({
        path: 'psychic',
        select: 'name image rate type bio abilities isAvailable',
        model: psychicName ? 'Psychic' : (psychicId && psychicId.includes('human') ? 'HumanPsychic' : 'Psychic')
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalRatings = await Rating.countDocuments(filter);

    // Get summary stats
    const stats = await Rating.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          totalWithComments: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$comment', ''] }, { $ne: ['$comment', null] }] }, 1, 0]
            }
          },
          ratingDistribution: {
            $push: '$rating'
          }
        }
      }
    ]);

    // Calculate rating distribution
    const ratingDistribution = {};
    if (stats[0]?.ratingDistribution) {
      stats[0].ratingDistribution.forEach(rating => {
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ratings,
        summary: {
          totalRatings: stats[0]?.totalRatings || 0,
          averageRating: stats[0]?.averageRating ? parseFloat(stats[0].averageRating.toFixed(2)) : 0,
          totalWithComments: stats[0]?.totalWithComments || 0,
          ratingDistribution
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRatings / parseInt(limit)),
          totalItems: totalRatings,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all ratings admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings'
    });
  }
});

// @desc    Delete rating by admin
// @route   DELETE /api/ratings/admin/:id
// @access  Private (Admin)
const deleteRatingAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid rating ID'
    });
  }

  try {
    const ratingDoc = await Rating.findById(id)
      .populate('psychic', 'name')
      .populate('user', 'firstName lastName email');
    
    if (!ratingDoc) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    const ratingData = {
      id: ratingDoc._id,
      rating: ratingDoc.rating,
      comment: ratingDoc.comment,
      psychicName: ratingDoc.psychic?.name,
      userName: `${ratingDoc.user?.firstName} ${ratingDoc.user?.lastName}`,
      userEmail: ratingDoc.user?.email
    };

    // Delete rating
    await ratingDoc.deleteOne();

    // Update psychic's average rating
    const avgRating = await Rating.getAverageRating(ratingDoc.psychic);

    // Log the deletion (you can add audit logging here)

    res.status(200).json({
      success: true,
      message: 'Rating deleted successfully',
      data: {
        deletedRating: ratingData,
        averageRating: avgRating.averageRating,
        totalRatings: avgRating.totalRatings
      }
    });
  } catch (error) {
    console.error('Delete rating admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rating'
    });
  }
});

// @desc    Update rating by admin
// @route   PUT /api/ratings/admin/:id
// @access  Private (Admin)
const updateRatingAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid rating ID'
    });
  }

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({
      success: false,
      message: 'Rating must be between 1 and 5'
    });
  }

  try {
    const ratingDoc = await Rating.findById(id);
    
    if (!ratingDoc) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    const oldData = {
      rating: ratingDoc.rating,
      comment: ratingDoc.comment
    };

    // Update rating
    if (rating !== undefined) ratingDoc.rating = rating;
    if (comment !== undefined) ratingDoc.comment = comment;
    ratingDoc.isEdited = true;
    ratingDoc.editedAt = new Date();
    ratingDoc.editedBy = 'admin'; // Track who edited
    
    await ratingDoc.save();

    // Update psychic's average rating
    const avgRating = await Rating.getAverageRating(ratingDoc.psychic);

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      data: {
        oldData,
        newData: {
          rating: ratingDoc.rating,
          comment: ratingDoc.comment
        },
        averageRating: avgRating.averageRating,
        totalRatings: avgRating.totalRatings
      }
    });
  } catch (error) {
    console.error('Update rating admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update rating'
    });
  }
});

// @desc    Get rating statistics for admin dashboard
// @route   GET /api/ratings/admin/statistics
// @access  Private (Admin)
const getRatingStatistics = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query; // day, week, month, year
  
  try {
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 1);
    }

    // Get total statistics
    const totalStats = await Rating.aggregate([
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingsWithComments: {
            $sum: {
              $cond: [{ $and: [{ $ne: ['$comment', ''] }, { $ne: ['$comment', null] }] }, 1, 0]
            }
          },
          editedRatings: {
            $sum: { $cond: [{ $eq: ['$isEdited', true] }, 1, 0] }
          }
        }
      }
    ]);

    // Get period statistics
    const periodStats = await Rating.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalRatings: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    // Get daily ratings for chart (last 30 days)
    const chartData = await Rating.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          averageRating: { $avg: "$rating" }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get top rated psychics
    const topPsychics = await Rating.aggregate([
      {
        $group: {
          _id: "$psychic",
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        }
      },
      {
        $sort: { averageRating: -1, totalRatings: -1 }
      },
      {
        $limit: 10
      },
      {
        $lookup: {
          from: 'psychics',
          localField: '_id',
          foreignField: '_id',
          as: 'psychicDetails'
        }
      },
      {
        $unwind: "$psychicDetails"
      },
      {
        $project: {
          psychicId: "$_id",
          psychicName: "$psychicDetails.name",
          psychicImage: "$psychicDetails.image",
          averageRating: { $round: ["$averageRating", 2] },
          totalRatings: 1
        }
      }
    ]);

    // Get rating distribution
    const ratingDistribution = await Rating.aggregate([
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalRatings: totalStats[0]?.totalRatings || 0,
          averageRating: totalStats[0]?.averageRating ? parseFloat(totalStats[0].averageRating.toFixed(2)) : 0,
          ratingsWithComments: totalStats[0]?.ratingsWithComments || 0,
          editedRatings: totalStats[0]?.editedRatings || 0,
          periodRatings: periodStats[0]?.totalRatings || 0,
          periodAverage: periodStats[0]?.averageRating ? parseFloat(periodStats[0].averageRating.toFixed(2)) : 0
        },
        chartData,
        topPsychics,
        ratingDistribution
      }
    });
  } catch (error) {
    console.error('Get rating statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rating statistics'
    });
  }
});




// ... existing imports and code ...

// @desc    Get all ratings for logged-in psychic (their own ratings)
// @route   GET /api/ratings/psychic/my-ratings
// @access  Private (Psychic)
const getPsychicMyRatings = asyncHandler(async (req, res) => {
  const psychicId = req.psychic._id;
  const { 
    page = 1, 
    limit = 10, 
    minRating,
    maxRating,
    hasComment,
    sortBy = 'createdAt', 
    sortOrder = 'desc' 
  } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Build filter
  const filter = { psychic: psychicId };
  
  // Rating filter
  const ratingFilter = {};
  if (minRating) ratingFilter.$gte = parseInt(minRating);
  if (maxRating) ratingFilter.$lte = parseInt(maxRating);
  if (Object.keys(ratingFilter).length > 0) {
    filter.rating = ratingFilter;
  }
  
  // Comment filter
  if (hasComment === 'true') {
    filter.comment = { $exists: true, $ne: '' };
  } else if (hasComment === 'false') {
    filter.comment = { $in: ['', null, undefined] };
  }

  try {
    // Get ratings with user details
    const ratings = await Rating.find(filter)
      .populate({
        path: 'user',
        select: 'firstName lastName username image country',
        model: 'User'
      })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const totalRatings = await Rating.countDocuments(filter);

    // Get average rating
    const avgRating = await Rating.getAverageRating(psychicId);

    // Get rating distribution
    const distribution = await Rating.aggregate([
      { $match: { psychic: new mongoose.Types.ObjectId(psychicId) } },
      { $group: {
          _id: '$rating',
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Format distribution
    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      const found = distribution.find(d => d._id === i);
      ratingDistribution[i] = found ? found.count : 0;
    }

    // Calculate percentages
    const ratingPercentages = {};
    Object.keys(ratingDistribution).forEach(rating => {
      ratingPercentages[rating] = totalRatings > 0 
        ? Math.round((ratingDistribution[rating] / totalRatings) * 100) 
        : 0;
    });

    res.status(200).json({
      success: true,
      data: {
        ratings,
        summary: {
          averageRating: avgRating.averageRating,
          totalRatings: avgRating.totalRatings,
          ratingDistribution,
          ratingPercentages
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalRatings / parseInt(limit)),
          totalItems: totalRatings,
          hasMore: skip + ratings.length < totalRatings
        }
      }
    });
  } catch (error) {
    console.error('Get psychic ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings'
    });
  }
});

// @desc    Get psychic's rating summary (for logged-in psychic)
// @route   GET /api/ratings/psychic/my-summary
// @access  Private (Psychic)
const getPsychicMySummary = asyncHandler(async (req, res) => {
  const psychicId = req.psychic._id;

  try {
    // Get average rating and total count
    const avgResult = await Rating.getAverageRating(psychicId);
    
    // Get rating distribution (1-5 stars)
    const distribution = await Rating.aggregate([
      { $match: { psychic: new mongoose.Types.ObjectId(psychicId) } },
      { $group: {
          _id: '$rating',
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    // Format distribution
    const ratingDistribution = {};
    const ratingPercentages = {};
    for (let i = 1; i <= 5; i++) {
      const found = distribution.find(d => d._id === i);
      ratingDistribution[i] = found ? found.count : 0;
      ratingPercentages[i] = avgResult.totalRatings > 0 
        ? Math.round((ratingDistribution[i] / avgResult.totalRatings) * 100) 
        : 0;
    }

    // Get latest reviews
    const latestReviews = await Rating.find({ psychic: psychicId })
      .populate({
        path: 'user',
        select: 'firstName lastName username image',
        model: 'User'
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent rating trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRatings = await Rating.aggregate([
      {
        $match: {
          psychic: new mongoose.Types.ObjectId(psychicId),
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          averageRating: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get recent average
    const recentAverage = recentRatings.length > 0
      ? recentRatings.reduce((sum, day) => sum + day.averageRating, 0) / recentRatings.length
      : 0;

    res.status(200).json({
      success: true,
      data: {
        summary: {
          averageRating: avgResult.averageRating,
          totalRatings: avgResult.totalRatings,
          recentAverage: parseFloat(recentAverage.toFixed(2)),
          ratingDistribution,
          ratingPercentages
        },
        latestReviews,
        recentTrend: recentRatings
      }
    });
  } catch (error) {
    console.error('Get psychic summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rating summary'
    });
  }
});

// @desc    Check if psychic has any ratings
// @route   GET /api/ratings/psychic/has-ratings
// @access  Private (Psychic)
const checkPsychicHasRatings = asyncHandler(async (req, res) => {
  const psychicId = req.psychic._id;

  try {
    const ratingCount = await Rating.countDocuments({ psychic: psychicId });
    const hasRatings = ratingCount > 0;
    
    const latestRating = await Rating.findOne({ psychic: psychicId })
      .sort({ createdAt: -1 })
      .populate('user', 'firstName lastName')
      .select('rating comment createdAt')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        hasRatings,
        totalRatings: ratingCount,
        latestRating: latestRating || null
      }
    });
  } catch (error) {
    console.error('Check psychic ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check ratings'
    });
  }
});

// @desc    Get psychic's monthly rating statistics
// @route   GET /api/ratings/psychic/monthly-stats
// @access  Private (Psychic)
const getPsychicMonthlyStats = asyncHandler(async (req, res) => {
  const psychicId = req.psychic._id;
  const { months = 6 } = req.query; // Default to last 6 months

  try {
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));

    const monthlyStats = await Rating.aggregate([
      {
        $match: {
          psychic: new mongoose.Types.ObjectId(psychicId),
          createdAt: { $gte: monthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
          ratingsWithComments: {
            $sum: {
              $cond: [{ $and: [{ $ne: ["$comment", ""] }, { $ne: ["$comment", null] }] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      },
      {
        $project: {
          month: {
            $dateToString: {
              format: "%Y-%m",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                  day: 1
                }
              }
            }
          },
          averageRating: { $round: ["$averageRating", 2] },
          totalRatings: 1,
          ratingsWithComments: 1
        }
      }
    ]);

    // Get comparison with previous period
    const previousPeriodStart = new Date(monthsAgo);
    previousPeriodStart.setMonth(previousPeriodStart.getMonth() - parseInt(months));

    const previousStats = await Rating.aggregate([
      {
        $match: {
          psychic: new mongoose.Types.ObjectId(psychicId),
          createdAt: { $gte: previousPeriodStart, $lt: monthsAgo }
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    const currentAvg = monthlyStats.length > 0 
      ? monthlyStats.reduce((sum, month) => sum + month.averageRating, 0) / monthlyStats.length
      : 0;

    const previousAvg = previousStats[0]?.averageRating || 0;
    const ratingChange = previousAvg > 0 
      ? ((currentAvg - previousAvg) / previousAvg) * 100 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        monthlyStats,
        comparison: {
          currentAverage: parseFloat(currentAvg.toFixed(2)),
          previousAverage: parseFloat(previousAvg.toFixed(2)),
          ratingChange: parseFloat(ratingChange.toFixed(2)),
          trend: ratingChange > 0 ? 'up' : ratingChange < 0 ? 'down' : 'stable'
        }
      }
    });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly statistics'
    });
  }
});

// @desc    Get psychic's rating by ID (for psychic's own view)
// @route   GET /api/ratings/psychic/rating/:id
// @access  Private (Psychic)
const getPsychicRatingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const psychicId = req.psychic._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid rating ID'
    });
  }

  try {
    const rating = await Rating.findOne({
      _id: id,
      psychic: psychicId
    })
    .populate({
      path: 'user',
      select: 'firstName lastName username image country joinDate',
      model: 'User'
    })
    .lean();

    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found or not authorized'
      });
    }

    // Get adjacent ratings (previous and next)
    const adjacentRatings = await Rating.find({
      psychic: psychicId,
      createdAt: { 
        $lt: new Date(rating.createdAt) 
      }
    })
    .sort({ createdAt: -1 })
    .limit(1)
    .select('_id')
    .lean();

    const nextRating = await Rating.find({
      psychic: psychicId,
      createdAt: { 
        $gt: new Date(rating.createdAt) 
      }
    })
    .sort({ createdAt: 1 })
    .limit(1)
    .select('_id')
    .lean();

    res.status(200).json({
      success: true,
      data: {
        rating,
        navigation: {
          previous: adjacentRatings[0]?._id || null,
          next: nextRating[0]?._id || null
        }
      }
    });
  } catch (error) {
    console.error('Get psychic rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rating'
    });
  }
});

// Export all functions including psychic ones
module.exports = {
  addRating,
  getRatingsByPsychic,
  getRatingsByUser,
  getAllRatings,
  getRatingById,
  updateRating,
  deleteRating,
  getPsychicRatingSummary,
  checkRatingExists,
  getAllRatingsAdmin,
  deleteRatingAdmin,
  updateRatingAdmin,
  getRatingStatistics,
  
  // Psychic-specific functions
  getPsychicMyRatings,
  getPsychicMySummary,
  checkPsychicHasRatings,
  getPsychicMonthlyStats,
  getPsychicRatingById
};