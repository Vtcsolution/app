const schedule = require("node-schedule");
const ActiveSession = require("../models/ActiveSession");
const ActiveCallSession = require("../models/CallSession/ActiveCallSession");
const Wallet = require("../models/Wallet");
const User = require("../models/User");
const CallSession = require("../models/CallSession/CallSession");
const Psychic = require('../models/HumanChat/Psychic');

// Simple lock manager to prevent concurrent processing
const processingLocks = new Set();

// Start credit deduction job - Runs every 5 seconds
const startCreditDeductionJob = (io) => {
  schedule.scheduleJob("*/5 * * * * *", async () => {
    try {
      const now = new Date();
      
      // 1. Process Chat Sessions
      const chatSessions = await ActiveSession.find({
        paidSession: true,
        paidStartTime: { $exists: true, $ne: null },
        isArchived: false,
        lock: false
      }).limit(20).lean();

      for (const session of chatSessions) {
        await processChatSession(session, io, now);
      }
      
      // 2. Process Audio Call Sessions
      const audioSessions = await ActiveCallSession.find({
        status: 'in-progress',
        startTime: { $exists: true, $ne: null },
        isArchived: false,
        lock: false
      }).limit(20).lean();

      if (audioSessions.length > 0) {
        console.log(`[Credit Job] Found ${audioSessions.length} active audio sessions`);
      }

      for (const session of audioSessions) {
        await processAudioSession(session, io, now);
      }

    } catch (error) {
      console.error("[Credit Job] General error:", error);
    }
  });
};

// Process Chat Session
async function processChatSession(session, io, now) {
  const lockKey = `chat_${session._id}`;
  
  if (processingLocks.has(lockKey)) return;
  
  try {
    processingLocks.add(lockKey);
    
    const lockedSession = await ActiveSession.findOneAndUpdate(
      { _id: session._id, lock: false, isArchived: false },
      { $set: { lock: true, lastProcessed: now } },
      { new: true }
    );

    if (!lockedSession) return;

    const wallet = await Wallet.findOne({ userId: session.userId });
    
    if (!wallet) {
      await ActiveSession.updateOne({ _id: session._id }, { $set: { lock: false } });
      return;
    }

    const elapsedSeconds = Math.floor((now - session.paidStartTime) / 1000);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const creditsToDeduct = elapsedMinutes - (session.lastDeductedMinute || 0);
    
    if (creditsToDeduct > 0 && wallet.credits >= creditsToDeduct) {
      const updatedWallet = await Wallet.findOneAndUpdate(
        { _id: wallet._id, credits: { $gte: creditsToDeduct } },
        { $inc: { credits: -creditsToDeduct }, $set: { lastDeduction: now } },
        { new: true }
      );
      
      if (updatedWallet) {
        await ActiveSession.updateOne(
          { _id: session._id },
          { $set: { lastDeductedMinute: elapsedMinutes, lastChargeTime: now } }
        );
        
        if (io) {
          io.to(session.userId.toString()).emit("creditsUpdate", {
            userId: session.userId,
            credits: updatedWallet.credits,
            deducted: creditsToDeduct,
            timestamp: now,
            sessionType: "chat"
          });
        }
        
        console.log(`[Credit Job] Chat: Deducted ${creditsToDeduct} credit(s) for user ${session.userId}, remaining: ${updatedWallet.credits}`);
      }
    }

    const totalPaidSeconds = session.initialCredits * 60;
    const remainingTime = Math.max(0, totalPaidSeconds - elapsedSeconds);

    if (io) {
      io.to(session.userId.toString()).emit("sessionUpdate", {
        sessionId: session._id,
        userId: session.userId,
        psychicId: session.psychicId,
        sessionType: "chat",
        isFree: false,
        remainingFreeTime: 0,
        paidTimer: remainingTime,
        credits: wallet.credits,
        status: wallet.credits > 0 ? "paid" : "insufficient_credits",
        showFeedbackModal: wallet.credits <= 0,
        freeSessionUsed: true,
        lastUpdated: now
      });
    }

    if (wallet.credits <= 0 || remainingTime <= 0) {
      console.log(`[Credit Job] Ending chat session ${session._id}`);
      
      await ActiveSession.updateOne(
        { _id: session._id },
        {
          $set: {
            paidSession: false,
            paidStartTime: null,
            isArchived: true,
            endedAt: now,
            endReason: wallet.credits <= 0 ? "insufficient_credits" : "time_completed",
            lock: false
          }
        }
      );
      
      if (io) {
        io.to(session.userId.toString()).emit("sessionEnded", {
          sessionId: session._id,
          sessionType: "chat",
          userId: session.userId,
          reason: wallet.credits <= 0 ? "Insufficient credits" : "Session time completed",
          remainingCredits: wallet.credits
        });
      }
    } else {
      await ActiveSession.updateOne({ _id: session._id }, { $set: { lock: false } });
    }

  } catch (error) {
    console.error(`[Credit Job] Error processing chat session ${session._id}:`, error);
    try {
      await ActiveSession.updateOne({ _id: session._id }, { $set: { lock: false } });
    } catch (unlockError) {}
  } finally {
    processingLocks.delete(lockKey);
  }
}

// Process Audio Call Session - COMPLETE FIXED VERSION
async function processAudioSession(session, io, now) {
  const lockKey = `audio_${session._id}`;
  
  if (processingLocks.has(lockKey)) return;
  
  try {
    processingLocks.add(lockKey);
    
    // Lock the session
    const lockedSession = await ActiveCallSession.findOneAndUpdate(
      { 
        _id: session._id, 
        lock: false,
        isArchived: false,
        status: 'in-progress'
      },
      { $set: { lock: true, lastProcessed: now } },
      { new: true }
    );

    if (!lockedSession) return;

    // Get user's wallet
    const wallet = await Wallet.findOne({ userId: session.userId });
    
    if (!wallet) {
      console.log(`[Credit Job] Wallet not found for user ${session.userId}`);
      await ActiveCallSession.updateOne({ _id: session._id }, { $set: { lock: false } });
      return;
    }

    // Calculate elapsed time
    const elapsedSeconds = Math.floor((now - new Date(session.startTime)) / 1000);
    const elapsedMinutes = Math.floor(elapsedSeconds / 60);
    const creditsPerMin = session.creditsPerMin || 1;
    
    // Calculate total credits that should be used
    let totalCreditsNeeded = elapsedMinutes * creditsPerMin;
    
    // Handle free session (first minute free)
    if (session.isFreeSession && !session.freeSessionUsed) {
      if (elapsedSeconds <= 60) {
        totalCreditsNeeded = 0;
      } else {
        const billableSeconds = elapsedSeconds - 60;
        const billableMinutes = Math.ceil(billableSeconds / 60);
        totalCreditsNeeded = billableMinutes * creditsPerMin;
      }
    }
    
    // Get current credits used from session
    const currentCreditsUsed = session.totalCreditsUsed || 0;
    const creditsToDeduct = totalCreditsNeeded - currentCreditsUsed;
    
    // Calculate remaining credits after potential deduction
    const remainingCreditsAfterDeduction = wallet.credits - creditsToDeduct;
    const remainingMinutesAfterDeduction = Math.floor(remainingCreditsAfterDeduction / creditsPerMin);
    
    console.log(`[Credit Job] Audio ${session._id}: elapsed=${elapsedSeconds}s, minutes=${elapsedMinutes}, needed=${totalCreditsNeeded}, used=${currentCreditsUsed}, toDeduct=${creditsToDeduct}, wallet=${wallet.credits}, remaining=${remainingCreditsAfterDeduction}, remainingMin=${remainingMinutesAfterDeduction}`);
    
    // CRITICAL: Check if user has enough credits for the ENTIRE call so far
    if (creditsToDeduct > 0) {
      if (wallet.credits >= creditsToDeduct) {
        // Deduct credits
        const updatedWallet = await Wallet.findOneAndUpdate(
          { _id: wallet._id, credits: { $gte: creditsToDeduct } },
          { $inc: { credits: -creditsToDeduct }, $set: { lastDeduction: now } },
          { new: true }
        );
        
        if (updatedWallet) {
          // Update session tracking
          await ActiveCallSession.updateOne(
            { _id: session._id },
            {
              $set: { 
                lastDeductedMinute: elapsedMinutes,
                lastChargeTime: now,
                totalCreditsUsed: totalCreditsNeeded
              }
            }
          );
          
          console.log(`[Credit Job] Audio: Deducted ${creditsToDeduct} credits, total used: ${totalCreditsNeeded}, remaining: ${updatedWallet.credits}`);
          
          // Emit real-time updates
          if (io) {
            io.to(session.userId.toString()).emit("audioCreditsUpdate", {
              sessionId: session._id,
              credits: updatedWallet.credits,
              deducted: creditsToDeduct,
              totalUsed: totalCreditsNeeded,
              duration: elapsedSeconds,
              ratePerMin: creditsPerMin,
              remainingMinutes: Math.floor(updatedWallet.credits / creditsPerMin)
            });
            
            if (session.roomName) {
              io.to(session.roomName).emit("credits-updated", {
                callSessionId: session._id,
                creditsUsed: totalCreditsNeeded,
                currentCredits: updatedWallet.credits,
                elapsedSeconds: elapsedSeconds,
                remainingMinutes: Math.floor(updatedWallet.credits / creditsPerMin)
              });
            }
          }
        }
      } else {
        // INSUFFICIENT CREDITS - End the call immediately
        console.log(`[Credit Job] ❌ INSUFFICIENT CREDITS! User has ${wallet.credits}, needs ${creditsToDeduct}. Ending call.`);
        
        await endCallDueToInsufficientCredits(session, now, totalCreditsNeeded, wallet.credits, io);
        return;
      }
    }
    
    // CRITICAL: Check if user has any credits left for FUTURE minutes
    // Get the latest wallet balance after deduction
    const finalWallet = await Wallet.findOne({ userId: session.userId });
    const finalCredits = finalWallet?.credits || 0;
    const finalRemainingMinutes = Math.floor(finalCredits / creditsPerMin);
    
    console.log(`[Credit Job] Post-deduction check: finalCredits=${finalCredits}, remainingMinutes=${finalRemainingMinutes}, elapsedMinutes=${elapsedMinutes}`);
    
    // End call if no credits remaining or if used minutes exceed available credits
    if (finalCredits <= 0 || (finalRemainingMinutes === 0 && elapsedMinutes > 0)) {
      console.log(`[Credit Job] ⚠️ CREDITS EXHAUSTED! Ending call.`);
      await endCallDueToInsufficientCredits(session, now, totalCreditsNeeded, finalCredits, io);
      return;
    }
    
    // Send periodic timer update (every 5 seconds)
    if (io && (elapsedSeconds % 5 === 0 || elapsedSeconds < 10)) {
      const currentSession = await ActiveCallSession.findById(session._id);
      
      io.to(session.userId.toString()).emit("timerSync", {
        callSessionId: session._id,
        elapsedSeconds: elapsedSeconds,
        creditsUsed: currentSession?.totalCreditsUsed || totalCreditsNeeded,
        creditsRemaining: finalCredits,
        remainingMinutes: finalRemainingMinutes
      });
      
      io.to(session.psychicId.toString()).emit("timerSync", {
        callSessionId: session._id,
        elapsedSeconds: elapsedSeconds,
        creditsUsed: currentSession?.totalCreditsUsed || totalCreditsNeeded,
        creditsRemaining: finalCredits
      });
    }
    
    // Unlock the session
    await ActiveCallSession.updateOne({ _id: session._id }, { $set: { lock: false } });

  } catch (error) {
    console.error(`[Credit Job] Error processing audio session ${session._id}:`, error);
    try {
      await ActiveCallSession.updateOne({ _id: session._id }, { $set: { lock: false } });
    } catch (unlockError) {}
  } finally {
    processingLocks.delete(lockKey);
  }
}

// Helper function to end call due to insufficient credits
async function endCallDueToInsufficientCredits(session, now, totalCreditsUsed, remainingCredits, io) {
  try {
    const endTime = now;
    const elapsedSeconds = Math.floor((now - new Date(session.startTime)) / 1000);
    
    // Update session as ended
    await ActiveCallSession.updateOne(
      { _id: session._id },
      {
        $set: {
          status: 'ended',
          endReason: 'insufficient_credits',
          endTime: endTime,
          isArchived: true,
          durationSeconds: elapsedSeconds,
          totalCreditsUsed: totalCreditsUsed,
          lock: false
        }
      }
    );
    
    // Create call history record
    await createCallHistoryRecord({ 
      ...session, 
      endTime: endTime,
      status: 'failed',
      endReason: 'insufficient_credits',
      totalCreditsUsed: totalCreditsUsed,
      durationSeconds: elapsedSeconds
    });
    
    // Notify user
    if (io) {
      io.to(session.userId.toString()).emit("callEnded", {
        sessionId: session._id,
        reason: "insufficient_credits",
        message: "Call ended: You have used all your credits",
        creditsRemaining: remainingCredits,
        totalCreditsUsed: totalCreditsUsed,
        duration: elapsedSeconds
      });
      
      // Notify psychic
      io.to(session.psychicId.toString()).emit("callEnded", {
        sessionId: session._id,
        reason: "insufficient_credits",
        message: "Call ended: User ran out of credits",
        duration: elapsedSeconds
      });
      
      // Close the room
      if (session.roomName) {
        io.to(session.roomName).emit("room-closed", {
          roomName: session.roomName,
          reason: "insufficient_credits",
          message: "Call ended due to insufficient credits"
        });
      }
    }
    
    console.log(`[Credit Job] ✅ Call ${session._id} ended due to insufficient credits after ${elapsedSeconds}s`);
  } catch (error) {
    console.error(`[Credit Job] Error ending call:`, error);
  }
}

// Create call history record
async function createCallHistoryRecord(session) {
  try {
    const psychic = await Psychic.findById(session.psychicId).select('callRatePerMin name');
    
    let callStatus = session.status || 'completed';
    let callEndReason = session.endReason || 'completed_normally';
    
    if (session.status === 'in-progress' || session.status === 'active') {
      if (session.endReason === 'insufficient_credits') {
        callStatus = 'failed';
        callEndReason = 'insufficient_credits';
      } else if (session.endReason === 'max_duration_reached') {
        callStatus = 'completed';
        callEndReason = 'max_duration_reached';
      } else if (session.endReason === 'abandoned') {
        callStatus = 'failed';
        callEndReason = 'participant_disconnected';
      } else {
        callStatus = 'completed';
        callEndReason = 'completed_normally';
      }
    }
    
    const ratePerMin = psychic?.callRatePerMin || session.ratePerMin || 1;
    const creditsPerMin = ratePerMin;
    const totalCreditsUsed = session.totalCreditsUsed || 0;
    const psychicEarnings = totalCreditsUsed * 0.7;
    const platformFee = totalCreditsUsed * 0.3;
    
    const callHistory = new CallSession({
      callSid: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomName: session.roomName,
      roomSid: session.twilioRoomSid,
      userId: session.userId,
      psychicId: session.psychicId,
      callRequestId: session.callRequestId,
      status: callStatus,
      endReason: callEndReason,
      startTime: session.startTime,
      endTime: session.endTime || new Date(),
      durationSeconds: session.durationSeconds || Math.floor(((session.endTime || new Date()) - session.startTime) / 1000),
      ratePerMin: ratePerMin,
      creditsPerMin: creditsPerMin,
      totalCreditsUsed: totalCreditsUsed,
      psychicEarnings: psychicEarnings,
      platformFee: platformFee,
      isFreeSession: session.isFreeSession || false,
      recordingUrl: session.recordingUrl
    });
    
    await callHistory.save();
    
    await Psychic.findByIdAndUpdate(session.psychicId, {
      $inc: {
        totalEarnings: psychicEarnings,
        totalCalls: 1,
        totalMinutes: Math.ceil(callHistory.durationSeconds / 60)
      }
    });
    
    console.log(`[Credit Job] Created call history for session ${session._id}, credits: ${totalCreditsUsed}, duration: ${callHistory.durationSeconds}s`);
  } catch (error) {
    console.error(`[Credit Job] Error creating call history:`, error);
  }
}

// Start free session timer job
const startFreeSessionTimerJob = (io) => {
  schedule.scheduleJob("* * * * * *", async () => {
    try {
      const now = new Date();
      
      const audioSessions = await ActiveCallSession.find({
        isFreeSession: true,
        freeSessionUsed: false,
        isArchived: false,
        lock: false,
        freeEndTime: { $exists: true, $lt: now }
      }).limit(20).lean();

      for (const session of audioSessions) {
        await processFreeAudioSessionEnd(session, io, now);
      }

    } catch (error) {
      console.error("[Free Session Job] General error:", error);
    }
  });
};

// Process free audio session end
async function processFreeAudioSessionEnd(session, io, now) {
  const lockKey = `free_audio_end_${session._id}`;
  
  if (processingLocks.has(lockKey)) return;
  
  try {
    processingLocks.add(lockKey);
    
    const lockedSession = await ActiveCallSession.findOneAndUpdate(
      { _id: session._id, lock: false, freeSessionUsed: false },
      { $set: { lock: true } },
      { new: true }
    );

    if (!lockedSession) return;

    await ActiveCallSession.updateOne(
      { _id: session._id },
      {
        $set: {
          freeSessionUsed: true,
          isFreeSession: false,
          lock: false
        }
      }
    );
    
    await User.updateOne(
      { _id: session.userId },
      { hasUsedFreeAudioMinute: true }
    );
    
    console.log(`[Free Session Job] Free audio session ended for user ${session.userId}`);
    
    if (io) {
      io.to(session.userId.toString()).emit("freeAudioEnded", {
        sessionId: session._id,
        message: "Your free minute has ended. Credits will now be deducted."
      });
      
      io.to(session.psychicId.toString()).emit("freeAudioEnded", {
        sessionId: session._id,
        message: "User's free minute has ended. Credits will now be deducted."
      });
    }

  } catch (error) {
    console.error(`[Free Session Job] Error:`, error);
  } finally {
    processingLocks.delete(lockKey);
  }
}

// Start call cleanup job
const startCallCleanupJob = (io) => {
  schedule.scheduleJob("*/2 * * * *", async () => {
    try {
      const now = new Date();
      const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
      
      const abandonedSessions = await ActiveCallSession.find({
        status: 'in-progress',
        lastProcessed: { $lt: thirtySecondsAgo },
        isArchived: false
      }).lean();

      for (const session of abandonedSessions) {
        console.log(`[Call Cleanup Job] Cleaning up abandoned session ${session._id}`);
        
        await ActiveCallSession.updateOne(
          { _id: session._id },
          { 
            $set: {
              status: 'ended',
              endReason: 'abandoned',
              endTime: now,
              isArchived: true,
              lock: false
            }
          }
        );
        
        await createCallHistoryRecord({ 
          ...session, 
          endTime: now,
          status: 'failed',
          endReason: 'participant_disconnected'
        });
        
        if (io) {
          io.to(session.userId.toString()).emit("callAutoEnded", {
            sessionId: session._id,
            reason: "Connection timeout",
            message: "Call was automatically ended due to inactivity"
          });
        }
      }
      
      if (abandonedSessions.length > 0) {
        console.log(`[Call Cleanup Job] Cleaned up ${abandonedSessions.length} abandoned sessions`);
      }
      
    } catch (error) {
      console.error("[Call Cleanup Job] General error:", error);
    }
  });
};

module.exports = { 
  startCreditDeductionJob, 
  startFreeSessionTimerJob,
  startCallCleanupJob
};