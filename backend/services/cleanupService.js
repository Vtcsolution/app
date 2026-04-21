const mongoose = require('mongoose');
const PaidTimer = require('../models/Paidtimer/PaidTimer');
const ChatRequest = require('../models/Paidtimer/ChatRequest');
const Wallet = require('../models/Wallet');
const Psychic = require('../models/HumanChat/Psychic');

class CleanupService {
  // Clean up stuck timers
  static async cleanupStuckTimers() {
    try {
      console.log('🧹 Checking for stuck timers...');
      
      const stuckTimers = await PaidTimer.find({
        status: 'active',
        remainingSeconds: { $lte: 0 }
      });
      
      for (const timer of stuckTimers) {
        console.log(`🧹 Cleaning up stuck timer: ${timer._id}`);
        
        timer.status = 'completed';
        timer.endTime = new Date();
        await timer.save();
        
        const chatRequest = await ChatRequest.findById(timer.chatRequestId);
        if (chatRequest) {
          chatRequest.status = 'completed';
          chatRequest.endedAt = new Date();
          chatRequest.paidSession.isActive = false;
          chatRequest.paidSession.endTime = new Date();
          
          // Update psychic status if needed
          if (chatRequest.psychic) {
            const psychic = await Psychic.findById(chatRequest.psychic);
            if (psychic) {
              await psychic.removeActiveSession(chatRequest._id);
              console.log(`👤 Psychic ${psychic.name} status updated after stuck timer cleanup`);
            }
          }
          
          await chatRequest.save();
        }
      }
      
      console.log(`✅ Cleaned up ${stuckTimers.length} stuck timers`);
    } catch (error) {
      console.error('Cleanup stuck timers error:', error);
    }
  }

  // Clean up orphaned active sessions
  static async cleanupOrphanedSessions() {
    try {
      console.log('🧹 Checking for orphaned sessions...');
      
      // Find active chat requests without a corresponding active timer
      const activeRequests = await ChatRequest.find({
        status: 'active',
        'paidSession.isActive': true
      });
      
      let cleanedCount = 0;
      
      for (const request of activeRequests) {
        // Check if timer exists and is active
        const timer = await PaidTimer.findOne({
          chatRequestId: request._id,
          status: 'active'
        });
        
        if (!timer) {
          console.log(`⚠️ Found orphaned active session: ${request._id}`);
          
          // Mark as completed
          request.status = 'completed';
          request.endedAt = new Date();
          request.paidSession.isActive = false;
          request.paidSession.endTime = new Date();
          
          // Update psychic status
          if (request.psychic) {
            const psychic = await Psychic.findById(request.psychic);
            if (psychic) {
              await psychic.removeActiveSession(request._id);
            }
          }
          
          await request.save();
          cleanedCount++;
        }
      }
      
      console.log(`✅ Cleaned up ${cleanedCount} orphaned sessions`);
    } catch (error) {
      console.error('Cleanup orphaned sessions error:', error);
    }
  }

  // Clean up locked wallets
  static async cleanupLockedWallets() {
    try {
      console.log('🧹 Checking for locked wallets...');
      
      const lockedWallets = await Wallet.find({
        lock: true,
        lockTime: { $lt: new Date(Date.now() - 5 * 60 * 1000) } // Locked for more than 5 minutes
      });
      
      for (const wallet of lockedWallets) {
        console.log(`🔓 Unlocking stuck wallet: ${wallet._id}`);
        wallet.lock = false;
        await wallet.save();
      }
      
      console.log(`✅ Unlocked ${lockedWallets.length} stuck wallets`);
    } catch (error) {
      console.error('Cleanup locked wallets error:', error);
    }
  }

  // Fix psychic status inconsistencies
  static async fixPsychicStatuses() {
    try {
      console.log('🔄 Fixing psychic status inconsistencies...');
      
      const psychics = await Psychic.find();
      let fixedCount = 0;
      
      for (const psychic of psychics) {
        let needsUpdate = false;
        
        // Check if psychic has active sessions but status is not busy
        if (psychic.currentSessions > 0 && psychic.status !== 'busy') {
          psychic.status = 'busy';
          needsUpdate = true;
          console.log(`👤 Psychic ${psychic.name} status fixed to busy (has ${psychic.currentSessions} sessions)`);
        }
        
        // Check if psychic has no active sessions but status is busy
        if (psychic.currentSessions === 0 && psychic.status === 'busy') {
          psychic.status = psychic.autoStatus || 'online';
          needsUpdate = true;
          console.log(`👤 Psychic ${psychic.name} status fixed to ${psychic.status} (no active sessions)`);
        }
        
        // Update availability
        const shouldBeAvailable = psychic.currentSessions < psychic.maxSessions;
        if (psychic.availability !== shouldBeAvailable) {
          psychic.availability = shouldBeAvailable;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await psychic.save();
          fixedCount++;
        }
      }
      
      console.log(`✅ Fixed ${fixedCount} psychic statuses`);
    } catch (error) {
      console.error('Fix psychic statuses error:', error);
    }
  }

  // Run all cleanup tasks
  static async runAllCleanupTasks() {
    console.log('🚀 Starting comprehensive cleanup...');
    
    try {
      await this.cleanupStuckTimers();
      await this.cleanupOrphanedSessions();
      await this.cleanupLockedWallets();
      await this.fixPsychicStatuses();
      
      console.log('🎉 All cleanup tasks completed successfully!');
    } catch (error) {
      console.error('Comprehensive cleanup error:', error);
    }
  }
}

module.exports = CleanupService;