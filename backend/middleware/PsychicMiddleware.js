// middleware/PsychicMiddleware.js - IMPROVED VERSION
const jwt = require('jsonwebtoken');
const Psychic = require('../models/HumanChat/Psychic');

const protectPsychic = async (req, res, next) => {
  console.log('🔐 [protectPsychic] Starting...');
  console.log('Cookies:', req.cookies ? Object.keys(req.cookies) : 'none');
  console.log('Headers:', req.headers.authorization ? 'Has Authorization' : 'No Authorization');
  
  let token;
  let tokenSource = 'none';

  // 1. Check psychicToken cookie (primary)
  if (req.cookies && req.cookies.psychicToken) {
    token = req.cookies.psychicToken;
    tokenSource = 'psychicToken cookie';
    console.log('✅ Token from psychicToken cookie');
  } 
  // 2. Check token cookie (secondary - for backward compatibility)
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    tokenSource = 'token cookie';
    console.log('⚠️ Token from generic token cookie - consider using psychicToken instead');
  }
  // 3. Check Authorization header
  else if (req.headers.authorization) {
    if (req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      tokenSource = 'Authorization header';
      console.log('✅ Token from Authorization header');
    } else {
      console.log('❌ Authorization header does not start with Bearer');
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use Bearer token.'
      });
    }
  }

  if (!token) {
    console.log('❌ No token found anywhere');
    return res.status(401).json({
      success: false,
      message: 'Not authorized, please login first',
      debug: process.env.NODE_ENV === 'development' ? {
        cookiesPresent: req.cookies ? Object.keys(req.cookies) : [],
        hasAuthHeader: !!req.headers.authorization
      } : undefined
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token verified. Decoded:', {
      id: decoded.id,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp
    });
    
    // CRITICAL: Check if this is a psychic token
    if (!decoded.role || decoded.role !== 'psychic') {
      console.log('❌ Token role is not psychic:', decoded.role);
      return res.status(403).json({ // Use 403 Forbidden instead of 401
        success: false,
        message: 'Access denied. Psychic only route.',
        debug: process.env.NODE_ENV === 'development' ? {
          tokenRole: decoded.role,
          expectedRole: 'psychic'
        } : undefined
      });
    }
    
    // Validate ID format
    if (!decoded.id) {
      console.log('❌ Token missing ID field');
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }
    
    // Find psychic by ID
    const psychic = await Psychic.findById(decoded.id).select('-password -resetPasswordToken -resetPasswordExpire');
    
    if (!psychic) {
      console.log('❌ Psychic not found for ID:', decoded.id);
      
      return res.status(401).json({
        success: false,
        message: 'Psychic account not found',
        debug: process.env.NODE_ENV === 'development' ? {
          tokenId: decoded.id,
          tokenRole: decoded.role,
          tokenSource: tokenSource
        } : undefined
      });
    }

    // Check if psychic is active/verified
    if (!psychic.isVerified) {
      console.log('❌ Psychic not verified:', psychic.email);
      return res.status(403).json({
        success: false,
        message: 'Account not verified. Please wait for admin approval.'
      });
    }

    console.log('✅ Psychic authenticated:', {
      id: psychic._id,
      name: psychic.name,
      email: psychic.email,
      verified: psychic.isVerified
    });
    
    // Attach psychic to request (both for compatibility)
    req.user = psychic;
    req.psychic = psychic;

    // Update last active timestamp (optional)
    psychic.lastActive = new Date();
    await psychic.save().catch(err => console.log('⚠️ Could not update lastActive:', err.message));

    next();

  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        debug: process.env.NODE_ENV === 'development' ? {
          error: error.message,
          tokenSource: tokenSource
        } : undefined
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      // Clear expired cookie
      res.clearCookie('psychicToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please login again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Optional: Middleware to check if psychic is online/available
const checkPsychicAvailability = async (req, res, next) => {
  if (!req.psychic) {
    return res.status(401).json({
      success: false,
      message: 'Psychic not authenticated'
    });
  }

  if (!req.psychic.availability) {
    return res.status(403).json({
      success: false,
      message: 'Psychic is currently unavailable'
    });
  }

  if (req.psychic.status === 'offline') {
    return res.status(403).json({
      success: false,
      message: 'Psychic is offline'
    });
  }

  if (req.psychic.currentSessions >= req.psychic.maxSessions) {
    return res.status(403).json({
      success: false,
      message: 'Psychic is at maximum session capacity'
    });
  }

  next();
};

module.exports = { 
  protectPsychic,
  checkPsychicAvailability 
};