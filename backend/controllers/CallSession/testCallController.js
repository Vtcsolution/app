console.log('🔧 Loading testCallController...');

try {
  console.log('1. Testing mongoose import...');
  const mongoose = require('mongoose');
  console.log('✅ mongoose loaded');
} catch (err) {
  console.error('❌ mongoose failed:', err.message);
}

try {
  console.log('2. Testing CallSession model import...');
  const CallSession = require('../../models/CallSession/CallSession');
  console.log('✅ CallSession loaded');
} catch (err) {
  console.error('❌ CallSession failed:', err.message);
}

try {
  console.log('3. Testing CallRequest model import...');
  const CallRequest = require('../../models/CallSession/CallRequest');
  console.log('✅ CallRequest loaded');
} catch (err) {
  console.error('❌ CallRequest failed:', err.message);
}

try {
  console.log('4. Testing Psychic model import...');
  const Psychic = require('../../models/HumanChat/Psychic');
  console.log('✅ Psychic loaded');
} catch (err) {
  console.error('❌ Psychic failed:', err.message);
}

try {
  console.log('5. Testing User model import...');
  const User = require('../../models/User');
  console.log('✅ User loaded');
} catch (err) {
  console.error('❌ User failed:', err.message);
}

try {
  console.log('6. Testing Wallet model import...');
  const Wallet = require('../../models/Wallet');
  console.log('✅ Wallet loaded');
} catch (err) {
  console.error('❌ Wallet failed:', err.message);
}

try {
  console.log('7. Testing creditService import...');
  const creditService = require('../../services/creditService');
  console.log('✅ creditService loaded');
} catch (err) {
  console.error('❌ creditService failed:', err.message);
}

console.log('🔧 All imports tested');

// Create simple controller
class TestCallController {
  constructor() {
    console.log('✅ TestCallController created');
  }
  
  async initiateCall(req, res) {
    console.log('📞 Test initiateCall called');
    return res.json({
      success: true,
      message: 'Test call initiated successfully!',
      data: {
        requestId: `test_${Date.now()}`,
        sessionId: `sess_${Date.now()}`,
        roomName: `room_${Date.now()}`,
        token: `token_${Date.now()}`,
        psychicId: req.body.psychicId,
        ratePerMin: 1.00,
        creditsPerMin: 1,
        expiresAt: new Date(Date.now() + 30000)
      }
    });
  }
  
  async acceptCall(req, res) {
    return res.json({
      success: true,
      message: 'Call accepted (test)'
    });
  }
  
  async rejectCall(req, res) {
    return res.json({
      success: true,
      message: 'Call rejected (test)'
    });
  }
  
  async endCall(req, res) {
    return res.json({
      success: true,
      message: 'Call ended (test)'
    });
  }
  
  twilioWebhook(req, res) {
    console.log('📞 Test webhook received');
    return res.status(200).send('OK');
  }
}

module.exports = new TestCallController();