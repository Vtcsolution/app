const express = require('express');
const router = express.Router();
const twilio = require('twilio');

// This handles Twilio voice webhooks
router.post('/voice', (req, res) => {
  console.log('📞 Twilio Voice Webhook Received:', {
    to: req.body.To,
    from: req.body.From,
    callSid: req.body.CallSid
  });
  
  const response = new twilio.twiml.VoiceResponse();
  
  // For MERN app: Connect client-to-client
  const to = req.body.To;
  
  if (to && to.startsWith('client:')) {
    // Remove 'client:' prefix
    const identity = to.replace('client:', '');
    
    const dial = response.dial({
      answerOnBridge: true,
      timeout: 30,
      action: '/api/twilio/call-status',
      method: 'POST'
    });
    
    dial.client(identity);
    console.log(`✅ Connecting to client: ${identity}`);
    
  } else {
    // Fallback for PSTN calls or errors
    response.say('Welcome to Hecate Voyance. Please wait while we connect your call.');
    const dial = response.dial();
    dial.client('support');
  }
  
  res.type('text/xml');
  res.send(response.toString());
});

// Call status callback
router.post('/call-status', (req, res) => {
  console.log('📞 Call Status Update:', {
    callSid: req.body.CallSid,
    callStatus: req.body.CallStatus,
    duration: req.body.CallDuration
  });
  res.status(200).send('OK');
});

module.exports = router;