const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const Psychic = require('../../models/HumanChat/Psychic');
const HumanChatSession = require('../../models/HumanChat/HumanChatSession');
const PaidTimer = require('../../models/Paidtimer/PaidTimer');
const ChatRequest = require('../../models/Paidtimer/ChatRequest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
// In psychicController.js, update the generateToken function
// In psychicController.js, update the generateToken function
const generateToken = (id) => {
  return jwt.sign(
    { 
      id, 
      role: 'psychic'  // Add the role here!
    }, 
    process.env.JWT_SECRET, {
      expiresIn: '30d',
    }
  );
};
// Helper function to format time
function formatTime(seconds) {
  if (!seconds) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

// Helper function to calculate average response time
async function calculateAverageResponseTime(psychicId) {
  try {
    // You would need a Message model with timestamps
    // This is a simplified version
    return 0; // Implement based on your message model
  } catch (error) {
    return null;
  }
}

// Helper function to calculate completion rate
async function calculateCompletionRate(psychicId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(psychicId)) {
      return 0;
    }
    
    const psychicObjectId = new mongoose.Types.ObjectId(psychicId);
    const stats = await ChatRequest.aggregate([
      { $match: { psychic: psychicObjectId } },
      { $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          completedRequests: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
      }}
    ]);
    
    if (stats[0] && stats[0].totalRequests > 0) {
      return (stats[0].completedRequests / stats[0].totalRequests) * 100;
    }
    return 0;
  } catch (error) {
    return null;
  }
}

// Helper function to calculate user retention rate
async function calculateUserRetentionRate(psychicId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(psychicId)) {
      return 0;
    }
    
    const psychicObjectId = new mongoose.Types.ObjectId(psychicId);
    const userStats = await ChatRequest.aggregate([
      { $match: { 
        psychic: psychicObjectId,
        status: { $in: ['completed', 'active'] }
      }},
      { $group: {
          _id: '$user',
          sessionCount: { $sum: 1 },
          firstSession: { $min: '$createdAt' },
          lastSession: { $max: '$updatedAt' }
      }}
    ]);
    
    const repeatUsers = userStats.filter(user => user.sessionCount > 1).length;
    const totalUsers = userStats.length;
    
    if (totalUsers > 0) {
      return (repeatUsers / totalUsers) * 100;
    }
    return 0;
  } catch (error) {
    return null;
  }
}


const registerPsychic = asyncHandler(async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    bio, 
    gender, 
    image, 
    category,
    abilities,      // Added missing field
    location,       // Added missing field
    languages,      // Added missing field
    experience,     // Added missing field
    specialization  // Added missing field
  } = req.body;

  console.log("📝 Registration attempt with data:", {
    name,
    email,
    gender,
    category,
    abilities: abilities ? 'provided' : 'not provided',
    location: location || 'not provided',
    languages: languages ? 'provided' : 'not provided',
    experience: experience || 'not provided',
    specialization: specialization || 'not provided',
    hasImage: !!image
  });

  // Validate required fields (ratePerMin removed from validation)
  if (!name || !email || !password || !bio || !gender || !category) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: name, email, password, bio, gender, category'
    });
  }

  try {
    // Check if email already exists
    const psychicExists = await Psychic.findOne({ email });
    if (psychicExists) {
      return res.status(400).json({
        success: false,
        message: 'Psychic with this email already exists'
      });
    }

    // Validate category is in the allowed list
    const validCategories = [
      'Tarot Reading', 'Astrology', 'Reading', 'Love & Relationships',
      'Career & Finance', 'Spiritual Guidance', 'Numerology', 
      'Clairvoyant', 'Dream Analysis'
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category selected'
      });
    }

    // Format abilities if provided as string
    let formattedAbilities = [];
    if (abilities) {
      if (typeof abilities === 'string') {
        formattedAbilities = abilities.split(',').map(a => a.trim()).filter(a => a);
      } else if (Array.isArray(abilities)) {
        formattedAbilities = abilities;
      }
    }

    // Format languages if provided as string
    let formattedLanguages = ['English']; // Default
    if (languages) {
      if (typeof languages === 'string') {
        formattedLanguages = languages.split(',').map(l => l.trim()).filter(l => l);
      } else if (Array.isArray(languages)) {
        formattedLanguages = languages;
      }
    }

    // Create psychic with all fields - ratePerMin set to default 1
    console.log("Creating psychic with category:", category);
    
    const psychic = await Psychic.create({
      name,
      email: email.toLowerCase(),
      password,
      ratePerMin: 1, // Default value of 1
      bio,
      gender,
      image: image || '',
      category,
      abilities: formattedAbilities,
      location: location || '',
      languages: formattedLanguages,
      experience: parseInt(experience) || 0,
      specialization: specialization || '',
      // Default values for other fields
      isVerified: false,
      availability: true,
      responseTime: 5,
      status: 'offline',
      currentSessions: 0,
      maxSessions: 1
    });

    console.log("✅ Psychic created successfully:", {
      id: psychic._id,
      name: psychic.name,
      category: psychic.category,
      ratePerMin: psychic.ratePerMin, // Should show 1
      abilities: psychic.abilities,
      location: psychic.location,
      languages: psychic.languages,
      experience: psychic.experience,
      specialization: psychic.specialization
    });

    if (psychic) {
      // Generate token
      const token = generateToken(psychic._id);
      
      // Set cookie
      res.cookie('psychicToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/'
      });

      // Don't send password in response
      const psychicResponse = psychic.toObject();
      delete psychicResponse.password;

      res.status(201).json({
        success: true,
        ...psychicResponse,
        token: token,
      });
    }
  } catch (error) {
    console.error("❌ Error creating psychic:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      errors: error.errors
    });
    
    return res.status(400).json({
      success: false,
      message: error.message || 'Invalid psychic data'
    });
  }
});

// @desc    Auth psychic & get token
// In psychicController.js - UPDATED loginPsychic function
const loginPsychic = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  // Find psychic by email (case insensitive)
  const psychic = await Psychic.findOne({ 
    email: email.toLowerCase() 
  });

  if (!psychic) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check password
  const isPasswordMatch = await psychic.matchPassword(password);
  if (!isPasswordMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if verified
  if (!psychic.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Account not verified. Please wait for admin approval.'
    });
  }

  // Generate token WITH ROLE
  const token = generateToken(psychic._id); // This now includes role

  // Clear any existing cookies first (important!)
  res.clearCookie('psychicToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });

  // Set new HTTP-only cookie
  res.cookie('psychicToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/'
  });

  // Log the token for debugging
  console.log('✅ Login successful - Token generated with role:', jwt.decode(token));

  res.json({
    success: true,
    _id: psychic._id,
    name: psychic.name,
    email: psychic.email,
    image: psychic.image,
    ratePerMin: psychic.ratePerMin,
    bio: psychic.bio,
    gender: psychic.gender,
    category: psychic.category,
    isVerified: psychic.isVerified,
    warningCount: psychic.warningCount || 0,
    isActive: psychic.isActive !== false,
    token: token, // Send token in response too
    message: 'Login successful'
  });
});


const forgotPasswordPsychic = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Basic validation
  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  try {
    // Find psychic by email
    const psychic = await Psychic.findOne({ email: email.toLowerCase() });
    
    // Always return same message for security (don't reveal if email exists)
    if (!psychic) {
      return res.status(200).json({
        success: true,
        message: 'If this email exists in our system, you will receive a password reset link'
      });
    }

    // Check if psychic is verified
    if (!psychic.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please contact admin for assistance.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token before saving to database
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save to database
    psychic.resetPasswordToken = hashedToken;
    psychic.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await psychic.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/psychic/reset-password/${resetToken}`;

    // Email content
    const message = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2B1B3F; margin-bottom: 10px;">Password Reset Request</h1>
          <p style="color: #666; font-size: 16px;">Hi ${psychic.name},</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">We received a request to reset your psychic account password. Click the button below to create a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #C9A24D; color: #2B1B3F; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">This link will expire in <strong>30 minutes</strong>.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
        </div>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center;">
          <p style="color: #999; font-size: 12px;">For security, never share this link with anyone.</p>
          <p style="color: #999; font-size: 12px;">&copy; ${new Date().getFullYear()} Hecate Voyance. All rights reserved.</p>
        </div>
        
        <!-- Fallback text link -->
        <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <p style="color: #666; font-size: 13px; margin: 0;">Or copy and paste this link into your browser:</p>
          <p style="color: #C9A24D; font-size: 13px; word-break: break-all; margin: 5px 0 0;">${resetUrl}</p>
        </div>
      </div>
    `;

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Hecate Voyance <Info@hecatevoyance.fr>',
      to: psychic.email,
      subject: 'Psychic Password Reset Request - Hecate Voyance',
      html: message,
      text: `Password Reset Request\n\nHi ${psychic.name},\n\nWe received a request to reset your password. Use this link to reset it:\n${resetUrl}\n\nThis link expires in 30 minutes.\n\nIf you didn't request this, please ignore this email.`
    };

    // Send email
    await transporter.sendMail(mailOptions);

    console.log(`📧 Password reset email sent to psychic: ${psychic.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email'
    });

  } catch (error) {
    console.error('❌ Psychic forgot password error:', error);
    
    // Clear any reset token if there was an error
    if (psychic) {
      psychic.resetPasswordToken = undefined;
      psychic.resetPasswordExpire = undefined;
      await psychic.save();
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email. Please try again later.'
    });
  }
});


const resetPasswordPsychic = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { password, confirmPassword } = req.body;

  // Validate inputs
  if (!password || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide password and confirm password'
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Passwords do not match'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  try {
    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find psychic with valid token
    const psychic = await Psychic.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!psychic) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token. Please request a new one.'
      });
    }

    // Update password
    psychic.password = password; // Will be hashed by pre-save middleware
    psychic.resetPasswordToken = undefined;
    psychic.resetPasswordExpire = undefined;
    await psychic.save();

    // Generate new token for auto-login
    const token = generateToken(psychic._id);

    // Set cookie
    res.cookie('psychicToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    console.log(`✅ Password reset successful for psychic: ${psychic.email}`);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.',
      token: token,
      psychic: {
        _id: psychic._id,
        name: psychic.name,
        email: psychic.email,
        image: psychic.image,
        isVerified: psychic.isVerified
      }
    });

  } catch (error) {
    console.error('❌ Psychic reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again.'
    });
  }
});

const updatePasswordPsychic = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const psychicId = req.psychic._id; // Assuming auth middleware sets req.psychic

  // Validate inputs
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide current password, new password, and confirm password'
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'New passwords do not match'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }

  try {
    // Find psychic with password field
    const psychic = await Psychic.findById(psychicId).select('+password');

    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    // Check current password
    const isMatch = await psychic.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    psychic.password = newPassword; // Will be hashed by pre-save middleware
    await psychic.save();

    // Generate new token
    const token = generateToken(psychic._id);

    // Update cookie
    res.cookie('psychicToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    console.log(`🔐 Password updated for psychic: ${psychic.email}`);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      token: token
    });

  } catch (error) {
    console.error('❌ Psychic update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password. Please try again.'
    });
  }
});


const verifyResetTokenPsychic = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;

  try {
    // Hash the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Find psychic with valid token
    const psychic = await Psychic.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    }).select('name email');

    if (!psychic) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      psychic: {
        name: psychic.name,
        email: psychic.email
      }
    });

  } catch (error) {
    console.error('❌ Verify reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token'
    });
  }
});



// @desc    Get psychic profile
const getPsychicProfile = asyncHandler(async (req, res) => {
  try {
    const psychic = await Psychic.findById(req.user._id).select('-password');
    
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    res.json({
      success: true,
      psychic: {
        _id: psychic._id,
        name: psychic.name,
        email: psychic.email,
        image: psychic.image, // Add this
        ratePerMin: psychic.ratePerMin,
        bio: psychic.bio,
        gender: psychic.gender,
        isVerified: psychic.isVerified,
        createdAt: psychic.createdAt,
        updatedAt: psychic.updatedAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// In psychicController.js - ADD logout function
const logoutPsychic = asyncHandler(async (req, res) => {
  // Clear all cookies
  res.clearCookie('psychicToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Add route
// @desc    Get detailed psychic profile with feedback and stats
// @desc    Get detailed psychic profile with feedback and stats
const getPsychicDetailedProfile = asyncHandler(async (req, res) => {
  try {
    const { psychicId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(psychicId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid psychic ID" 
      });
    }

    // 1. Fetch psychic details
    const psychic = await Psychic.findById(psychicId)
      .select('-password -__v')
      .lean();
    
    if (!psychic) {
      return res.status(404).json({ 
        success: false, 
        message: "Psychic not found" 
      });
    }

    // Add default image if missing
    if (!psychic.image) {
      psychic.image = `https://ui-avatars.com/api/?name=${encodeURIComponent(psychic.name)}&background=7c3aed&color=fff&size=256`;
    }

    // 2. Fetch feedback with userName (using Rating model)
    let feedbackData = [];
    let averageRating = 0;
    let feedbackCount = 0;
    
    try {
      // Check if Rating model exists
      const Rating = require('../../models/HumanChat/Rating'); // Adjust path as needed
      
      const feedback = await Rating.find({ psychic: psychicId })
        .populate("user", "firstName lastName username")
        .sort({ createdAt: -1 })
        .limit(50) // Limit to recent 50 reviews
        .lean();

      feedbackData = feedback.map(f => ({
        userName: f.user?.firstName && f.user?.lastName 
          ? `${f.user.firstName} ${f.user.lastName}`
          : f.user?.username || "Anonymous",
        rating: f.rating || 0,
        message: f.comment || "",
        gift: f.gift || false,
        createdAt: f.createdAt,
        sessionId: f.sessionId || null
      }));

      feedbackCount = feedback.length;
      if (feedbackCount > 0) {
        const totalRating = feedback.reduce((sum, f) => sum + (f.rating || 0), 0);
        averageRating = parseFloat((totalRating / feedbackCount).toFixed(1));
      }
    } catch (error) {
      console.log("No feedback found or Rating model not available:", error.message);
    }

    // 3. Fetch chat statistics from ChatRequest model (better than HumanChatSession for paid sessions)
    let chatStats = {
      totalChats: 0,
      totalMessages: 0,
      averageSessionDuration: 0,
      totalRevenue: 0,
      totalChatSeconds: 0,
      completedSessions: 0
    };

    try {
      // Get chat statistics from ChatRequest (paid sessions)
      const stats = await ChatRequest.aggregate([
        { $match: { 
          psychic: new mongoose.Types.ObjectId(psychicId),
          status: { $in: ['completed', 'active'] }
        }},
        {
          $group: {
            _id: null,
            totalChats: { $sum: 1 },
            completedSessions: { 
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } 
            },
            totalRevenue: { $sum: '$totalAmountPaid' },
            totalChatSeconds: { $sum: '$paidSession.totalSeconds' },
            totalMessages: { 
              $sum: { 
                $add: [
                  { $ifNull: ['$paidSession.messagesSent', 0] },
                  { $ifNull: ['$paidSession.messagesReceived', 0] }
                ]
              }
            }
          }
        }
      ]);

      if (stats[0]) {
        chatStats.totalChats = stats[0].totalChats || 0;
        chatStats.totalMessages = stats[0].totalMessages || 0;
        chatStats.totalRevenue = stats[0].totalRevenue || 0;
        chatStats.totalChatSeconds = stats[0].totalChatSeconds || 0;
        chatStats.completedSessions = stats[0].completedSessions || 0;
        
        if (chatStats.completedSessions > 0) {
          // Convert seconds to minutes
          chatStats.averageSessionDuration = Math.round(chatStats.totalChatSeconds / chatStats.completedSessions / 60);
        }
      }
    } catch (error) {
      console.log("Error fetching chat stats:", error.message);
    }

    // 4. Fetch HumanChatSession statistics (free chats)
    let freeChatStats = {
      totalFreeChats: 0,
      totalFreeMessages: 0
    };

    try {
      const freeStats = await HumanChatSession.aggregate([
        { $match: { psychic: new mongoose.Types.ObjectId(psychicId) } },
        {
          $lookup: {
            from: 'messageboxes',
            localField: '_id',
            foreignField: 'chatSession',
            as: 'messages'
          }
        },
        {
          $group: {
            _id: null,
            totalFreeChats: { $sum: 1 },
            totalFreeMessages: { $sum: { $size: "$messages" } }
          }
        }
      ]);

      if (freeStats[0]) {
        freeChatStats.totalFreeChats = freeStats[0].totalFreeChats || 0;
        freeChatStats.totalFreeMessages = freeStats[0].totalFreeMessages || 0;
      }
    } catch (error) {
      console.log("Error fetching free chat stats:", error.message);
    }

    // 5. Format abilities if needed
    let abilities = psychic.abilities || [];
    if (typeof abilities === 'string') {
      abilities = abilities.split(',').map(a => a.trim()).filter(a => a);
    }

    // 6. Format languages if needed
    let languages = psychic.languages || ['English'];
    if (typeof languages === 'string') {
      languages = languages.split(',').map(l => l.trim()).filter(l => l);
    }

    // 7. Calculate overall stats
    const totalChats = chatStats.totalChats + freeChatStats.totalFreeChats;
    const totalMessages = chatStats.totalMessages + freeChatStats.totalFreeMessages;
    
    // 8. Format response data
    const responseData = {
      ...psychic,
      abilities: abilities,
      languages: languages,
      type: psychic.type || "Human Psychic",
      rating: {
        averageRating: averageRating,
        feedbackCount: feedbackCount,
        totalRatings: feedbackCount
      },
      feedback: feedbackData,
      stats: {
        chat: {
          totalChats: totalChats,
          paidChats: chatStats.totalChats,
          freeChats: freeChatStats.totalFreeChats,
          totalMessages: totalMessages,
          paidMessages: chatStats.totalMessages,
          freeMessages: freeChatStats.totalFreeMessages,
          averageSessionDuration: chatStats.averageSessionDuration,
          completedSessions: chatStats.completedSessions
        },
        financial: {
          totalRevenue: chatStats.totalRevenue,
          averageRevenuePerSession: chatStats.completedSessions > 0 
            ? Math.round(chatStats.totalRevenue / chatStats.completedSessions * 100) / 100
            : 0,
          totalChatSeconds: chatStats.totalChatSeconds,
          totalChatMinutes: Math.round(chatStats.totalChatSeconds / 60),
          totalChatHours: Math.round((chatStats.totalChatSeconds / 3600) * 100) / 100
        },
        performance: {
          responseTime: psychic.responseTime || 5, // minutes
          availability: psychic.availability !== undefined ? psychic.availability : true,
          experience: psychic.experience || 0,
          specialization: psychic.specialization || ''
        }
      },
      rate: {
        perMinute: psychic.ratePerMin || 1.00,
        perHour: (psychic.ratePerMin || 1.00) * 60
      }
    };

    res.status(200).json({
      success: true,
      data: {
        psychic: responseData,
      },
    });
  } catch (error) {
    console.error("Error fetching psychic profile:", error.message);
    res.status(500).json({ 
      success: false, 
      message: "Server error while fetching psychic profile",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// @desc    Get all psychics
const getAllPsychics = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isVerified,
      gender,
      minRate,
      maxRate,
      search,
      category,
      all = 'false' // Add this parameter to control whether to return all psychics
    } = req.query;

    const filter = {};
    
    // Only apply isVerified filter if explicitly provided
    // Remove the default isVerified = true
    if (isVerified !== undefined) {
      filter.isVerified = isVerified === 'true';
    }
    // Don't add default isVerified filter
    
    if (gender) {
      filter.gender = gender;
    }
    
    // Add category filter
    if (category) {
      // Handle multiple categories if passed as comma-separated
      if (category.includes(',')) {
        const categories = category.split(',');
        filter.category = { $in: categories };
      } else {
        filter.category = category;
      }
    }
    
    if (minRate || maxRate) {
      filter.ratePerMin = {};
      if (minRate) filter.ratePerMin.$gte = Number(minRate);
      if (maxRate) filter.ratePerMin.$lte = Number(maxRate);
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    let psychicsQuery = Psychic.find(filter)
      .select('name bio ratePerMin gender isVerified image category createdAt updatedAt specialization abilities languages experience status lastSeen');

    // Check if we need to return all psychics (no pagination)
    if (all === 'true') {
      // Return all psychics without pagination
      const psychics = await psychicsQuery.sort(sort);
      
      // Add default image if missing
      const psychicsWithImages = psychics.map(psychic => ({
        ...psychic.toObject(),
        image: psychic.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(psychic.name)}&background=7c3aed&color=fff&size=256`,
        category: psychic.category || 'Reading'
      }));

      return res.json({
        success: true,
        count: psychics.length,
        psychics: psychicsWithImages
      });
    }

    // Otherwise, apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    const psychics = await psychicsQuery
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Add default image if missing
    const psychicsWithImages = psychics.map(psychic => ({
      ...psychic.toObject(),
      image: psychic.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(psychic.name)}&background=7c3aed&color=fff&size=256`,
      category: psychic.category || 'Reading'
    }));

    const total = await Psychic.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get category statistics
    const categoryStats = await Psychic.aggregate([
      { $match: filter },
      { $group: {
          _id: '$category',
          count: { $sum: 1 }
      }},
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      count: psychics.length,
      total,
      totalPages,
      currentPage: Number(page),
      psychics: psychicsWithImages,
      filters: {
        category: categoryStats.map(stat => ({
          name: stat._id || 'Reading',
          count: stat.count
        }))
      }
    });
  } catch (error) {
    console.error('Get all psychics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching psychics'
    });
  }
});
// @desc    Get all psychic categories with counts
const getPsychicCategories = asyncHandler(async (req, res) => {
  try {
    // Get only categories that actually exist in the database
    const categories = await Psychic.aggregate([
      { 
        $match: { 
          isVerified: true,
          category: { $exists: true, $ne: null, $ne: "" } // Only where category exists and is not empty
        } 
      },
      { 
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averageRating: { $avg: '$averageRating' },
          psychics: { $push: '$$ROOT' }
        }
      },
      { 
        $project: {
          name: '$_id',
          count: 1,
          averageRating: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log('Found categories:', categories); // Debug log

    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});
// @desc    Get psychic by ID
// In your getPsychicById function, add this check:
const getPsychicById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Handle special case for "me" or "my-status"
    if (id === 'me' || id === 'my-status') {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID. Use /my-status endpoint for authenticated psychic.'
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID format'
      });
    }

    const psychic = await Psychic.findById(id)
      .select('name bio ratePerMin gender image isVerified createdAt updatedAt');

    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    // Add default image if missing
    const psychicWithImage = {
      ...psychic.toObject(),
      image: psychic.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(psychic.name)}&background=7c3aed&color=fff&size=256`
    };

    res.json({
      success: true,
      psychic: psychicWithImage
    });
  } catch (error) {
    console.error('Get psychic by ID error:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID format'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
// @desc    Update psychic profile
const updatePsychicProfile = asyncHandler(async (req, res) => {
  try {
    const psychic = await Psychic.findById(req.psychic._id);

    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    // Update fields if provided
    psychic.name = req.body.name || psychic.name;
    psychic.email = req.body.email ? req.body.email.toLowerCase() : psychic.email;
    psychic.ratePerMin = req.body.ratePerMin || psychic.ratePerMin;
    psychic.bio = req.body.bio || psychic.bio;
    psychic.gender = req.body.gender || psychic.gender;
    psychic.image = req.body.image || psychic.image; // Add this

    // Update password if provided
    if (req.body.password) {
      psychic.password = req.body.password;
    }

    const updatedPsychic = await psychic.save();

    res.json({
      success: true,
      psychic: {
        _id: updatedPsychic._id,
        name: updatedPsychic.name,
        email: updatedPsychic.email,
        image: updatedPsychic.image, // Add this
        ratePerMin: updatedPsychic.ratePerMin,
        bio: updatedPsychic.bio,
        gender: updatedPsychic.gender,
        isVerified: updatedPsychic.isVerified,
        token: generateToken(updatedPsychic._id),
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});
// @desc    Update psychic status (online/offline/away/busy)
// @route   PUT /api/psychics/status
// @access  Psychic only

// @desc    Delete psychic account
const deletePsychicAccount = asyncHandler(async (req, res) => {
  try {
    const psychic = await Psychic.findById(req.psychic._id);

    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    await psychic.deleteOne();
    
    res.json({
      success: true,
      message: 'Psychic account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Verify psychic (admin only)
const verifyPsychic = asyncHandler(async (req, res) => {
  try {
    const psychic = await Psychic.findById(req.params.id);

    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    psychic.isVerified = true;
    const updatedPsychic = await psychic.save();

    res.json({
      success: true,
      psychic: updatedPsychic
    });
  } catch (error) {
    console.error('Verify psychic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Unverify psychic (admin only)
const unverifyPsychic = asyncHandler(async (req, res) => {
  try {
    const psychic = await Psychic.findById(req.params.id);

    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    psychic.isVerified = false;
    const updatedPsychic = await psychic.save();

    res.json({
      success: true,
      psychic: updatedPsychic
    });
  } catch (error) {
    console.error('Unverify psychic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get psychic chat statistics and analytics
const getPsychicChatAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get psychic ID from authenticated psychic (from protectPsychic middleware)
    const psychicId = req.psychic?._id;
    
    if (!psychicId) {
      return res.status(400).json({
        success: false,
        message: 'Psychic ID is required. Please login.'
      });
    }

    // Verify psychic ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(psychicId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID format'
      });
    }

    // Verify psychic exists
    const psychic = await Psychic.findById(psychicId);
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    // Convert to ObjectId safely
    const psychicObjectId = new mongoose.Types.ObjectId(psychicId);

    // Get current date for time-based calculations
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // 1. Get total chat requests count by status
    const chatRequestStats = await ChatRequest.aggregate([
      { $match: { psychic: psychicObjectId } },
      { $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDuration: { $sum: '$paidSession.totalSeconds' },
          totalAmount: { $sum: '$totalAmountPaid' }
      }},
      { $project: {
          status: '$_id',
          count: 1,
          totalDuration: 1,
          totalAmount: 1,
          avgDuration: { $divide: ['$totalDuration', '$count'] },
          _id: 0
      }}
    ]);

    // 2. Get total unique users who chatted with this psychic
    const uniqueUsers = await ChatRequest.distinct('user', { 
      psychic: psychicObjectId,
      status: { $in: ['accepted', 'active', 'completed'] }
    });

    // 3. Get total chat time in seconds
    const timeStats = await ChatRequest.aggregate([
      { $match: { 
        psychic: psychicObjectId,
        'paidSession.totalSeconds': { $gt: 0 }
      }},
      { $group: {
          _id: null,
          totalChatSeconds: { $sum: '$paidSession.totalSeconds' },
          totalSessions: { $sum: 1 },
          avgSessionSeconds: { $avg: '$paidSession.totalSeconds' },
          maxSessionSeconds: { $max: '$paidSession.totalSeconds' },
          minSessionSeconds: { $min: '$paidSession.totalSeconds' },
          totalRevenue: { $sum: '$totalAmountPaid' }
      }}
    ]);

    // 4. Get chat time by period (today, week, month, year)
    const periodStats = await Promise.all([
      // Today
      ChatRequest.aggregate([
        { $match: { 
          psychic: psychicObjectId,
          updatedAt: { $gte: startOfToday },
          'paidSession.totalSeconds': { $gt: 0 }
        }},
        { $group: {
            _id: null,
            totalSeconds: { $sum: '$paidSession.totalSeconds' },
            sessionCount: { $sum: 1 },
            revenue: { $sum: '$totalAmountPaid' }
        }}
      ]),
      
      // This week
      ChatRequest.aggregate([
        { $match: { 
          psychic: psychicObjectId,
          updatedAt: { $gte: startOfWeek },
          'paidSession.totalSeconds': { $gt: 0 }
        }},
        { $group: {
            _id: null,
            totalSeconds: { $sum: '$paidSession.totalSeconds' },
            sessionCount: { $sum: 1 },
            revenue: { $sum: '$totalAmountPaid' }
        }}
      ]),
      
      // This month
      ChatRequest.aggregate([
        { $match: { 
          psychic: psychicObjectId,
          updatedAt: { $gte: startOfMonth },
          'paidSession.totalSeconds': { $gt: 0 }
        }},
        { $group: {
            _id: null,
            totalSeconds: { $sum: '$paidSession.totalSeconds' },
            sessionCount: { $sum: 1 },
            revenue: { $sum: '$totalAmountPaid' }
        }}
      ]),
      
      // This year
      ChatRequest.aggregate([
        { $match: { 
          psychic: psychicObjectId,
          updatedAt: { $gte: startOfYear },
          'paidSession.totalSeconds': { $gt: 0 }
        }},
        { $group: {
            _id: null,
            totalSeconds: { $sum: '$paidSession.totalSeconds' },
            sessionCount: { $sum: 1 },
            revenue: { $sum: '$totalAmountPaid' }
        }}
      ])
    ]);

    // 5. Get top users by chat time
    const topUsers = await ChatRequest.aggregate([
      { $match: { 
        psychic: psychicObjectId,
        'paidSession.totalSeconds': { $gt: 0 }
      }},
      { $group: {
          _id: '$user',
          totalSeconds: { $sum: '$paidSession.totalSeconds' },
          sessionCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmountPaid' },
          lastChat: { $max: '$updatedAt' },
          firstChat: { $min: '$createdAt' }
      }},
      { $sort: { totalSeconds: -1 } },
      { $limit: 10 },
      { $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
      }},
      { $unwind: { path: '$userDetails', preserveNullAndEmptyArrays: true } },
      { $project: {
          userId: '$_id',
          userName: '$userDetails.name',
          userEmail: '$userDetails.email',
          totalChatSeconds: '$totalSeconds',
          totalChatMinutes: { $divide: ['$totalSeconds', 60] },
          totalChatHours: { $divide: ['$totalSeconds', 3600] },
          sessionCount: '$sessionCount',
          totalSpent: '$totalSpent',
          lastChatDate: '$lastChat',
          firstChatDate: '$firstChat',
          avgSessionSeconds: { $divide: ['$totalSeconds', '$sessionCount'] },
          _id: 0
      }}
    ]);

    // 6. Get chat session statistics
    const chatSessionStats = await HumanChatSession.aggregate([
      { $match: { psychic: psychicObjectId } },
      { $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$sessionDuration' },
          totalMessages: { 
            $sum: { 
              $add: ['$unreadCounts.user', '$unreadCounts.psychic']
            }
          }
      }},
      { $project: {
          status: '$_id',
          count: 1,
          avgDuration: 1,
          totalMessages: 1,
          _id: 0
      }}
    ]);

    // 7. Get active paid timers
    const activeTimers = await PaidTimer.aggregate([
      { $match: { 
        psychic: psychicObjectId,
        status: { $in: ['active', 'paused'] }
      }},
      { $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRemainingSeconds: { $sum: '$remainingSeconds' },
          totalPotentialRevenue: { 
            $sum: { 
              $multiply: [
                { $divide: ['$remainingSeconds', 60] },
                '$ratePerMin'
              ]
            }
          }
      }}
    ]);

    // Format the response
    const response = {
      success: true,
      psychicId: psychic._id,
      psychicName: psychic.name,
      statistics: {
        summary: {
          totalUniqueUsers: uniqueUsers.length,
          totalChatSessions: timeStats[0]?.totalSessions || 0,
          totalChatTimeSeconds: timeStats[0]?.totalChatSeconds || 0,
          totalChatTimeMinutes: timeStats[0] ? Math.round(timeStats[0].totalChatSeconds / 60) : 0,
          totalChatTimeHours: timeStats[0] ? Math.round((timeStats[0].totalChatSeconds / 3600) * 100) / 100 : 0,
          totalRevenue: timeStats[0]?.totalRevenue || 0,
          averageSessionTimeSeconds: timeStats[0]?.avgSessionSeconds || 0,
          averageSessionTimeMinutes: timeStats[0] ? Math.round(timeStats[0].avgSessionSeconds / 60) : 0,
          maxSessionSeconds: timeStats[0]?.maxSessionSeconds || 0,
          minSessionSeconds: timeStats[0]?.minSessionSeconds || 0
        },
        byPeriod: {
          today: {
            chatSeconds: periodStats[0][0]?.totalSeconds || 0,
            sessions: periodStats[0][0]?.sessionCount || 0,
            revenue: periodStats[0][0]?.revenue || 0
          },
          thisWeek: {
            chatSeconds: periodStats[1][0]?.totalSeconds || 0,
            sessions: periodStats[1][0]?.sessionCount || 0,
            revenue: periodStats[1][0]?.revenue || 0
          },
          thisMonth: {
            chatSeconds: periodStats[2][0]?.totalSeconds || 0,
            sessions: periodStats[2][0]?.sessionCount || 0,
            revenue: periodStats[2][0]?.revenue || 0
          },
          thisYear: {
            chatSeconds: periodStats[3][0]?.totalSeconds || 0,
            sessions: periodStats[3][0]?.sessionCount || 0,
            revenue: periodStats[3][0]?.revenue || 0
          }
        },
        chatRequests: {
          byStatus: chatRequestStats.reduce((acc, stat) => {
            acc[stat.status] = stat;
            return acc;
          }, {}),
          total: chatRequestStats.reduce((sum, stat) => sum + stat.count, 0)
        },
        chatSessions: {
          byStatus: chatSessionStats.reduce((acc, stat) => {
            acc[stat.status] = stat;
            return acc;
          }, {}),
          total: chatSessionStats.reduce((sum, stat) => sum + stat.count, 0)
        },
        topUsers: topUsers.map(user => ({
          ...user,
          totalChatTimeFormatted: formatTime(user.totalChatSeconds),
          avgSessionFormatted: formatTime(user.avgSessionSeconds)
        })),
        activeTimers: activeTimers.reduce((acc, timer) => {
          acc[timer._id] = {
            count: timer.count,
            totalRemainingSeconds: timer.totalRemainingSeconds,
            totalRemainingMinutes: Math.round(timer.totalRemainingSeconds / 60),
            potentialRevenue: timer.totalPotentialRevenue
          };
          return acc;
        }, {}),
        performance: {
          avgResponseTime: await calculateAverageResponseTime(psychicId),
          completionRate: await calculateCompletionRate(psychicId),
          userRetentionRate: await calculateUserRetentionRate(psychicId)
        }
      }
    };

    res.json(response);

  } catch (error) {
    console.error('Get psychic analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching psychic analytics'
    });
  }
});

// @desc    Get psychic chat statistics summary (lightweight version)
const getPsychicChatStats = asyncHandler(async (req, res) => {
  try {
    const psychicId = req.psychic?._id;
    
    if (!psychicId) {
      return res.status(400).json({
        success: false,
        message: 'Psychic ID is required'
      });
    }

    // Verify psychic ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(psychicId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID format'
      });
    }

    // Convert to ObjectId safely
    const psychicObjectId = new mongoose.Types.ObjectId(psychicId);

    // Get quick stats
    const [
      totalChats,
      totalChatTime,
      totalRevenue,
      uniqueUsers
    ] = await Promise.all([
      // Total chats (completed or active)
      ChatRequest.countDocuments({
        psychic: psychicObjectId,
        status: { $in: ['accepted', 'active', 'completed'] }
      }),
      
      // Total chat time in seconds
      ChatRequest.aggregate([
        { $match: { 
          psychic: psychicObjectId,
          'paidSession.totalSeconds': { $gt: 0 }
        }},
        { $group: {
            _id: null,
            totalSeconds: { $sum: '$paidSession.totalSeconds' }
        }}
      ]),
      
      // Total revenue
      ChatRequest.aggregate([
        { $match: { 
          psychic: psychicObjectId,
          totalAmountPaid: { $gt: 0 }
        }},
        { $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmountPaid' }
        }}
      ]),
      
      // Unique users
      ChatRequest.distinct('user', { 
        psychic: psychicObjectId,
        status: { $in: ['accepted', 'active', 'completed'] }
      })
    ]);

    const totalSeconds = totalChatTime[0]?.totalSeconds || 0;
    const totalMinutes = Math.round(totalSeconds / 60);
    const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;
    const revenue = totalRevenue[0]?.totalRevenue || 0;

    res.json({
      success: true,
      stats: {
        totalChatSessions: totalChats,
        totalChatTime: {
          seconds: totalSeconds,
          minutes: totalMinutes,
          hours: totalHours,
          formatted: formatTime(totalSeconds)
        },
        totalRevenue: revenue,
        uniqueUsersCount: uniqueUsers.length,
        averageSessionMinutes: totalChats > 0 ? Math.round(totalMinutes / totalChats) : 0,
        averageRevenuePerSession: totalChats > 0 ? Math.round((revenue / totalChats) * 100) / 100 : 0
      }
    });

  } catch (error) {
    console.error('Get psychic stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching psychic stats'
    });
  }
});



const adminCreatePsychic = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      ratePerMin,
      bio,
      gender,
      category, // ADD THIS
      image,
      abilities,
      location,
      languages,
      experience,
      specialization,
      isVerified = false,
      availability = true,
      responseTime = 5
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !ratePerMin || !bio || !gender || !category) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, ratePerMin, bio, gender, category'
      });
    }

    // Check if email already exists
    const psychicExists = await Psychic.findOne({ email: email.toLowerCase() });
    if (psychicExists) {
      return res.status(400).json({
        success: false,
        message: 'Psychic with this email already exists'
      });
    }

    // Format abilities if provided as string
    let formattedAbilities = [];
    if (abilities) {
      if (typeof abilities === 'string') {
        formattedAbilities = abilities.split(',').map(a => a.trim()).filter(a => a);
      } else if (Array.isArray(abilities)) {
        formattedAbilities = abilities;
      }
    }

    // Format languages if provided as string
    let formattedLanguages = ['English']; // Default
    if (languages) {
      if (typeof languages === 'string') {
        formattedLanguages = languages.split(',').map(l => l.trim()).filter(l => l);
      } else if (Array.isArray(languages)) {
        formattedLanguages = languages;
      }
    }

    // Create psychic
    const psychic = await Psychic.create({
      name,
      email: email.toLowerCase(),
      password,
      ratePerMin: parseFloat(ratePerMin),
      bio,
      gender,
      category, // ADD THIS
      image: image || '',
      abilities: formattedAbilities,
      location: location || '',
      languages: formattedLanguages,
      experience: parseInt(experience) || 0,
      specialization: specialization || '',
      isVerified: isVerified === true || isVerified === 'true',
      availability: availability === true || availability === 'true',
      responseTime: parseInt(responseTime) || 5
    });

    // Don't send password in response
    const psychicResponse = psychic.toObject();
    delete psychicResponse.password;

    res.status(201).json({
      success: true,
      message: 'Psychic created successfully',
      data: psychicResponse
    });
  } catch (error) {
    console.error('Admin create psychic error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating psychic'
    });
  }
});

// @desc    Toggle verify/unverify psychic (admin only)
const adminToggleVerifyPsychic = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Validate psychic ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID'
      });
    }

    // Check if psychic exists
    const psychic = await Psychic.findById(id);
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    // Toggle verification status
    psychic.isVerified = !psychic.isVerified;
    const updatedPsychic = await psychic.save();

    res.json({
      success: true,
      message: `Psychic ${updatedPsychic.isVerified ? 'verified' : 'unverified'} successfully`,
      data: {
        id: updatedPsychic._id,
        name: updatedPsychic.name,
        email: updatedPsychic.email,
        isVerified: updatedPsychic.isVerified
      }
    });
  } catch (error) {
    console.error('Admin toggle verify psychic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling verification'
    });
  }
});
// @desc    Get all psychics for admin (including unverified)
const getAllPsychicsForAdmin = asyncHandler(async (req, res) => {
  try {
    const {
      search = '',
      isVerified,
      gender,
      availability
    } = req.query;

    const filter = {};
    
    // Apply filters if provided
    if (isVerified !== undefined && isVerified !== 'all') {
      filter.isVerified = isVerified === 'true';
    }
    
    if (gender && gender !== 'all') {
      filter.gender = gender;
    }
    
    if (availability && availability !== 'all') {
      filter.availability = availability === 'true';
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Get all psychics (no pagination for now)
    const psychics = await Psychic.find(filter)
      .select('-password -__v')
      .sort({ createdAt: -1 });

    // Add default image if missing
    const psychicsWithImages = psychics.map(psychic => {
      const psychicObj = psychic.toObject();
      if (!psychicObj.image) {
        psychicObj.image = `https://ui-avatars.com/api/?name=${encodeURIComponent(psychicObj.name)}&background=7c3aed&color=fff&size=256`;
      }
      return psychicObj;
    });

    res.json({
      success: true,
      data: psychicsWithImages,
      count: psychics.length
    });
  } catch (error) {
    console.error('Get all psychics for admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching psychics'
    });
  }
});

// @desc    Delete psychic (admin only)
const adminDeletePsychic = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Validate psychic ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid psychic ID'
      });
    }

    // Check if psychic exists
    const psychic = await Psychic.findById(id);
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    // Delete the psychic
    await psychic.deleteOne();

    res.json({
      success: true,
      message: 'Psychic deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete psychic error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting psychic'
    });
  }
});


let io;

// Function to set io instance (call this in your server.js)
const setIoInstance = (socketIo) => {
  io = socketIo;
};

const updatePsychicStatus = asyncHandler(async (req, res) => {
  try {
    // Get psychic from auth middleware
    const psychic = await Psychic.findById(req.psychic._id);

    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    const { status } = req.body;

    // Validate status
    const allowedStatuses = ['online', 'offline', 'away', 'busy'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: online, offline, away, busy'
      });
    }

    // Store old status for comparison
    const oldStatus = psychic.status;
    
    // Update status and timestamps
    psychic.status = status;
    psychic.lastActive = new Date();
    
    // If going offline, update last seen
    if (status === 'offline') {
      psychic.lastSeen = new Date();
    }

    // Save changes
    await psychic.save();

    // ========== UPDATE GLOBAL CACHE IMMEDIATELY ==========
    if (global.psychicStatusCache) {
      global.psychicStatusCache.set(psychic._id.toString(), {
        status: psychic.status,
        lastSeen: psychic.lastSeen,
        lastActive: psychic.lastActive,
        timestamp: Date.now(),
        lastUpdate: Date.now()
      });
    }

    // ========== EMIT SOCKET.IO EVENT INSTANTLY ==========
    if (global.io && oldStatus !== status) {
      const statusData = {
        psychicId: psychic._id.toString(),
        status: psychic.status,
        timestamp: Date.now(),
        lastSeen: psychic.lastSeen,
        lastActive: psychic.lastActive
      };
      
      // Emit to all users subscribed to this psychic's status
      global.io.to(`psychic_status_${psychic._id}`).emit('psychic_status_changed', statusData);
      
      // Also emit to global psychic list room
      global.io.to('psychic_list_status').emit('psychic_status_update', statusData);
      
      console.log(`📡 Emitted INSTANT status update for psychic ${psychic._id}: ${status}`);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: `Status updated to ${status}`,
      data: {
        status: psychic.status,
        lastActive: psychic.lastActive,
        lastSeen: psychic.lastSeen,
        isOnline: psychic.status === 'online'
      }
    });

  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get psychic's own status
const getMyStatus = asyncHandler(async (req, res) => {
  try {
    const psychic = await Psychic.findById(req.psychic._id).select('status lastActive lastSeen');
    
    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    res.status(200).json({
      success: true,
      status: psychic.status || 'offline',
      lastActive: psychic.lastActive,
      lastSeen: psychic.lastSeen
    });

  } catch (error) {
    console.error('Get my status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching status'
    });
  }
});

// Get single psychic status - OPTIMIZED WITH CACHE
const getPsychicStatus = asyncHandler(async (req, res) => {
  try {
    const { psychicId } = req.body;

    if (!psychicId) {
      return res.status(400).json({
        success: false,
        message: 'Psychic ID is required'
      });
    }

    // Check cache first (INSTANT)
    if (global.psychicStatusCache) {
      const cached = global.psychicStatusCache.get(psychicId.toString());
      if (cached && (Date.now() - cached.timestamp < 10000)) {
        return res.status(200).json({
          success: true,
          status: cached.status,
          lastActive: cached.lastActive,
          lastSeen: cached.lastSeen,
          fromCache: true
        });
      }
    }

    // Fallback to database
    const psychic = await Psychic.findById(psychicId).select('status lastActive lastSeen');

    if (!psychic) {
      return res.status(404).json({
        success: false,
        message: 'Psychic not found'
      });
    }

    res.status(200).json({
      success: true,
      status: psychic.status || 'offline',
      lastActive: psychic.lastActive,
      lastSeen: psychic.lastSeen
    });

  } catch (error) {
    console.error('Get psychic status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get all psychic statuses (INSTANT CACHE RESPONSE)
const getPsychicStatuses = asyncHandler(async (req, res) => {
  try {
    const { psychicIds } = req.body;

    if (!psychicIds || !Array.isArray(psychicIds)) {
      return res.status(400).json({
        success: false,
        message: 'Psychic IDs array is required'
      });
    }

    const statuses = {};
    const needsFetch = [];
    
    // 1. Check cache first (INSTANT)
    if (global.psychicStatusCache) {
      psychicIds.forEach(id => {
        const cached = global.psychicStatusCache.get(id.toString());
        if (cached && (Date.now() - cached.timestamp < 30000)) { // 30 seconds cache
          statuses[id] = {
            status: cached.status,
            lastActive: cached.lastActive,
            lastSeen: cached.lastSeen,
            fromCache: true
          };
        } else {
          needsFetch.push(id);
        }
      });
    } else {
      needsFetch.push(...psychicIds);
    }

    // 2. Only query database for missing ones
    if (needsFetch.length > 0) {
      const psychics = await Psychic.find({ 
        _id: { $in: needsFetch } 
      }).select('_id status lastActive lastSeen').lean();

      psychics.forEach(psychic => {
        const data = {
          status: psychic.status || 'offline',
          lastActive: psychic.lastActive,
          lastSeen: psychic.lastSeen,
          fromCache: false
        };
        
        statuses[psychic._id.toString()] = data;
        
        // Update cache for future requests
        if (global.psychicStatusCache) {
          global.psychicStatusCache.set(psychic._id.toString(), {
            status: psychic.status || 'offline',
            lastSeen: psychic.lastSeen,
            lastActive: psychic.lastActive,
            timestamp: Date.now()
          });
        }
      });
    }

    res.status(200).json({
      success: true,
      statuses,
      cacheHits: Object.keys(statuses).length - needsFetch.length,
      dbQueries: needsFetch.length
    });

  } catch (error) {
    console.error('Get psychic statuses error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ========== ADD THIS: ULTRA-FAST STATUS ENDPOINT ==========
const getPsychicStatusesFast = asyncHandler(async (req, res) => {
  try {
    const { psychicIds } = req.body;

    if (!psychicIds || !Array.isArray(psychicIds)) {
      return res.status(400).json({
        success: false,
        message: 'Psychic IDs array is required'
      });
    }

    const statuses = {};
    
    // ONLY USE CACHE - NO DATABASE QUERIES
    if (global.psychicStatusCache) {
      psychicIds.forEach(id => {
        const cached = global.psychicStatusCache.get(id.toString());
        if (cached) {
          statuses[id] = {
            status: cached.status,
            lastActive: cached.lastActive,
            lastSeen: cached.lastSeen,
            timestamp: cached.timestamp,
            fromCache: true
          };
        } else {
          // If not in cache, assume offline
          statuses[id] = {
            status: 'offline',
            lastActive: null,
            lastSeen: null,
            fromCache: false,
            estimated: true
          };
        }
      });
    } else {
      // If no cache, return all offline (fast response)
      psychicIds.forEach(id => {
        statuses[id] = {
          status: 'offline',
          lastActive: null,
          lastSeen: null,
          fromCache: false,
          estimated: true
        };
      });
    }

    res.status(200).json({
      success: true,
      statuses,
      instant: true,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Fast status error:', error);
    // Still return something fast
    const statuses = {};
    psychicIds?.forEach(id => {
      statuses[id] = {
        status: 'offline',
        estimated: true
      };
    });
    
    res.status(200).json({
      success: true,
      statuses,
      instant: true,
      error: 'Using estimated statuses'
    });
  }
});




// Export all functions
module.exports = {
  // Keep all existing non-admin exports
  registerPsychic,
   updatePsychicStatus,
  getMyStatus,
  getPsychicStatus,
  forgotPasswordPsychic,
  resetPasswordPsychic,
  updatePasswordPsychic,
  verifyResetTokenPsychic,
  getPsychicStatuses,
  getPsychicStatusesFast, // Add this
  setIoInstance,
  loginPsychic,
  getPsychicStatus,
  logoutPsychic,
  getPsychicProfile,
  getAllPsychics,
  getPsychicById,
  getMyStatus,
  updatePsychicProfile,
  deletePsychicAccount,
  verifyPsychic,
  updatePsychicStatus,
  getPsychicStatuses,
  getPsychicCategories,
  setIoInstance,
  unverifyPsychic,
  getPsychicChatAnalytics,
  getPsychicChatStats,
  getPsychicDetailedProfile,
    getAllPsychicsForAdmin, // Add this
adminDeletePsychic,
  // Keep only these two admin functions
  adminCreatePsychic,
  adminToggleVerifyPsychic
};