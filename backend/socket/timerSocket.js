const PaidTimer = require('../models/Paidtimer/PaidTimer');
const ChatRequest = require('../models/Paidtimer/ChatRequest');

module.exports = (io) => {
  io.on('connection', (socket) => {
    
    // Join user room
    socket.on('join_user_room', ({ userId }) => {
      const roomName = `user_${userId}`;
      socket.join(roomName);

    });
    
    // Join timer room
    socket.on('join_timer_room', async ({ requestId, userId, userRole }) => {
      const roomName = `timer_${requestId}`;
      socket.join(roomName);

      
      try {
        const chatRequest = await ChatRequest.findById(requestId);
        const paidTimer = await PaidTimer.findOne({ chatRequestId: requestId });
        
        if (chatRequest && paidTimer) {
          // Send current state
          socket.emit('timer_state', {
            requestId,
            remainingSeconds: paidTimer.remainingSeconds,
            status: paidTimer.status,
            isPaused: paidTimer.isPaused,
            remainingBalance: paidTimer.remainingBalance,
            ratePerMin: 1,
            startTime: paidTimer.startTime,
            totalSeconds: paidTimer.totalSeconds
          });
          
          // Start emitting timer updates
          startTimerBroadcast(io, requestId, paidTimer);
        }
      } catch (error) {
        console.error('Error sending timer state:', error);
      }
    });
    
    // Timer control events - KEEP EXISTING CODE
    // ... (keep your existing pause_timer, resume_timer, stop_timer handlers)
    
    socket.on('disconnect', () => {
      console.log('🔌 Timer socket disconnected:', socket.id);
    });
  });
};

// Function to broadcast timer updates
function startTimerBroadcast(io, requestId, paidTimer) {
  // Clear existing interval if any
  if (global.timerBroadcasts && global.timerBroadcasts[requestId]) {
    clearInterval(global.timerBroadcasts[requestId]);
  }
  
  const broadcastInterval = setInterval(async () => {
    try {
      const updatedTimer = await PaidTimer.findOne({ chatRequestId: requestId });
      if (!updatedTimer || updatedTimer.status !== 'active' || updatedTimer.isPaused) {
        clearInterval(broadcastInterval);
        delete global.timerBroadcasts?.[requestId];
        return;
      }
      
      // Calculate remaining time
      const now = new Date();
      const elapsed = Math.floor((now - updatedTimer.startTime) / 1000);
      const remaining = Math.max(0, updatedTimer.totalSeconds - elapsed);
      
      // Emit to timer room
      io.to(`timer_${requestId}`).emit('timer_tick', {
        requestId,
        remainingSeconds: remaining,
        elapsedSeconds: elapsed,
        formattedTime: formatTime(remaining),
        remainingBalance: updatedTimer.remainingBalance
      });
      
      // Emit to user room
      io.to(`user_${updatedTimer.user}`).emit('timer_update', {
        requestId,
        remainingSeconds: remaining,
        formattedTime: formatTime(remaining)
      });
      
    } catch (error) {
      console.error('Timer broadcast error:', error);
      clearInterval(broadcastInterval);
      delete global.timerBroadcasts?.[requestId];
    }
  }, 1000); // Update every second
  
  // Store interval reference
  global.timerBroadcasts = global.timerBroadcasts || {};
  global.timerBroadcasts[requestId] = broadcastInterval;
}

// Helper function to format time
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}