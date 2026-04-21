const ChatRequest = require('../models/Paidtimer/ChatRequest');
const PaidTimer = require('../models/Paidtimer/PaidTimer');
const Wallet = require('../models/Wallet');
const Notification = require('../models/Paidtimer/Notification');
const mongoose = require('mongoose');

class TimerService {
  constructor() {
    this.activeTimers = new Map();
  }

  // Initialize timer service
  async initialize() {
    // Restore active timers from database on server start
    const activeRequests = await ChatRequest.find({
      'paidSession.isActive': true,
      'paidSession.isPaused': false
    });

    for (const request of activeRequests) {
      this.startTimerForRequest(request._id);
    }
  }

  // Start timer for a chat request
  async startTimerForRequest(chatRequestId) {
    if (this.activeTimers.has(chatRequestId)) {
      console.log(`Timer already running for request ${chatRequestId}`);
      return;
    }

    const intervalId = setInterval(async () => {
      await this.processSecond(chatRequestId);
    }, 1000);

    this.activeTimers.set(chatRequestId, intervalId);
    console.log(`Started timer for request ${chatRequestId}`);
  }

  // Process one second of timer
  async processSecond(chatRequestId) {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const chatRequest = await ChatRequest.findById(chatRequestId).session(session);
        if (!chatRequest || 
            !chatRequest.paidSession.isActive || 
            chatRequest.paidSession.isPaused ||
            chatRequest.paidSession.remainingSeconds <= 0) {
          
          this.stopTimer(chatRequestId);
          return;
        }

        // Update remaining seconds
        chatRequest.paidSession.remainingSeconds -= 1;
        
        // Update paid timer if exists
        const paidTimer = await PaidTimer.findOne({ chatRequestId }).session(session);
        if (paidTimer) {
          paidTimer.remainingSeconds = chatRequest.paidSession.remainingSeconds;
          paidTimer.lastDeductionTime = new Date();
          await paidTimer.save({ session });
        }

        // Check if second boundary crossed for real-time updates
        const oldTotalSeconds = Math.floor(chatRequest.paidSession.remainingSeconds + 1);
        const newTotalSeconds = Math.floor(chatRequest.paidSession.remainingSeconds);
        
        // Check if minute boundary crossed (for deductions)
        const oldMinutes = Math.floor(oldTotalSeconds / 60);
        const newMinutes = Math.floor(newTotalSeconds / 60);

        if (newMinutes < oldMinutes) {
          // Minute has passed, deduct balance
          await this.deductMinute(chatRequest, session);
        }

        // Check if timer expired
        if (chatRequest.paidSession.remainingSeconds <= 0) {
          await this.handleTimerExpiration(chatRequest, session);
          this.stopTimer(chatRequestId);
        }

        await chatRequest.save({ session });

        // Emit real-time update every second for timer display
        if (global.io) {
          const remainingTime = Math.max(0, chatRequest.paidSession.remainingSeconds);
          
          global.io.to(`user_${chatRequest.user}`).emit('timer_update', {
            requestId: chatRequest._id,
            remainingSeconds: remainingTime,
            formattedTime: this.formatTime(remainingTime)
          });

          global.io.to(`psychic_${chatRequest.psychic}`).emit('timer_update', {
            requestId: chatRequest._id,
            remainingSeconds: remainingTime,
            formattedTime: this.formatTime(remainingTime)
          });

          // Emit balance update every second for real-time display
          const wallet = await Wallet.findOne({ userId: chatRequest.user }).session(session);
          if (wallet) {
            global.io.to(`user_${chatRequest.user}`).emit('wallet_balance_update', {
              requestId: chatRequest._id,
              balance: wallet.balance,
              remainingMinutes: Math.floor(wallet.balance / chatRequest.ratePerMin)
            });
          }
        }
      });
    } catch (error) {
    } finally {
      session.endSession();
    }
  }

  // Deduct one minute's worth of balance - UPDATED
  async deductMinute(chatRequest, session) {
    try {
      const wallet = await Wallet.findOne({ userId: chatRequest.user }).session(session);
      if (!wallet) {
        console.error('Wallet not found for user:', chatRequest.user);
        return;
      }

      // Check if wallet is locked
      if (wallet.lock) {
        console.log('Wallet is locked, retrying in next interval...');
        return;
      }

      // Lock the wallet to prevent concurrent updates
      wallet.lock = true;
      await wallet.save({ session });

      // Deduct one minute's rate
      const amountToDeduct = chatRequest.ratePerMin;
      
      if (wallet.balance >= amountToDeduct) {
        // Perform deduction
        wallet.balance -= amountToDeduct;
        chatRequest.remainingBalance = wallet.balance;
        
        // Record deduction
        chatRequest.deductions.push({
          amount: amountToDeduct,
          timestamp: new Date(),
          secondsUsed: 60,
          remainingBalance: wallet.balance
        });

        chatRequest.totalAmountPaid = (chatRequest.totalAmountPaid || 0) + amountToDeduct;

        // Save wallet and chat request
        await wallet.save({ session });
        await chatRequest.save({ session });

        // Create payment notification
        const notification = new Notification({
          recipient: chatRequest.user,
          recipientModel: 'User',
          sender: chatRequest.psychic,
          senderModel: 'Psychic',
          type: 'payment_deducted',
          title: 'Payment Deducted',
          message: `${amountToDeduct} credits deducted for chat session`,
          data: {
            chatRequestId: chatRequest._id,
            amount: amountToDeduct,
            remainingBalance: wallet.balance,
            remainingMinutes: Math.floor(wallet.balance / chatRequest.ratePerMin)
          },
          chatRequestId: chatRequest._id
        });

        await notification.save({ session });

        // Emit balance update
        if (global.io) {
          global.io.to(`user_${chatRequest.user}`).emit('balance_updated', {
            requestId: chatRequest._id,
            newBalance: wallet.balance,
            deductedAmount: amountToDeduct,
            remainingSeconds: chatRequest.paidSession.remainingSeconds
          });

          // Also emit wallet update for header
          global.io.to(`user_${chatRequest.user}`).emit('wallet_update', {
            balance: wallet.balance,
            credits: wallet.credits || wallet.balance // Use balance as credits if credits not set
          });
        }

        // Check for low balance
        if (wallet.balance < chatRequest.ratePerMin) {
          const remainingMinutes = Math.floor(wallet.balance / chatRequest.ratePerMin);
          const lowBalanceNotification = new Notification({
            recipient: chatRequest.user,
            recipientModel: 'User',
            sender: chatRequest.psychic,
            senderModel: 'Psychic',
            type: 'balance_low',
            title: 'Low Balance Warning',
            message: `Only ${remainingMinutes} minute(s) remaining`,
            data: {
              chatRequestId: chatRequest._id,
              remainingBalance: wallet.balance,
              remainingMinutes: remainingMinutes
            },
            chatRequestId: chatRequest._id
          });

          await lowBalanceNotification.save({ session });

          if (global.io) {
            global.io.to(`user_${chatRequest.user}`).emit('balance_low', {
              requestId: chatRequest._id,
              message: `Low balance: ${remainingMinutes} minute(s) remaining`,
              remainingBalance: wallet.balance
            });
          }
        }
      } else {
        console.log('Insufficient balance for deduction:', {
          userId: chatRequest.user,
          currentBalance: wallet.balance,
          required: amountToDeduct
        });
        
        // Stop timer if insufficient balance
        this.stopTimer(chatRequest._id);
        
        // Update chat request status
        chatRequest.status = 'completed';
        chatRequest.endedAt = new Date();
        chatRequest.paidSession.isActive = false;
        chatRequest.paidSession.endTime = new Date();
        await chatRequest.save({ session });

        // Emit insufficient balance event
        if (global.io) {
          global.io.to(`user_${chatRequest.user}`).emit('insufficient_balance', {
            requestId: chatRequest._id,
            message: 'Insufficient balance to continue session'
          });
          
          global.io.to(`psychic_${chatRequest.psychic}`).emit('session_ended', {
            requestId: chatRequest._id,
            reason: 'insufficient_balance'
          });
        }
      }

      // Unlock wallet
      wallet.lock = false;
      await wallet.save({ session });

    } catch (error) {
      console.error('Deduction error:', error);
      
      // Try to unlock wallet if error occurred
      try {
        const wallet = await Wallet.findOne({ userId: chatRequest.user }).session(session);
        if (wallet && wallet.lock) {
          wallet.lock = false;
          await wallet.save({ session });
        }
      } catch (unlockError) {
        console.error('Failed to unlock wallet after error:', unlockError);
      }
    }
  }

  // Handle timer expiration
  async handleTimerExpiration(chatRequest, session) {
    chatRequest.status = 'completed';
    chatRequest.endedAt = new Date();
    chatRequest.paidSession.isActive = false;
    chatRequest.paidSession.endTime = new Date();

    // Update paid timer
    const paidTimer = await PaidTimer.findOne({ chatRequestId: chatRequest._id }).session(session);
    if (paidTimer) {
      paidTimer.status = 'expired';
      paidTimer.endTime = new Date();
      await paidTimer.save({ session });
    }

    // Create expiration notifications
    const userNotification = new Notification({
      recipient: chatRequest.user,
      recipientModel: 'User',
      sender: chatRequest.psychic,
      senderModel: 'Psychic',
      type: 'session_ended',
      title: 'Session Expired',
      message: 'Your paid session has expired',
      data: {
        chatRequestId: chatRequest._id,
        totalAmountPaid: chatRequest.totalAmountPaid
      },
      chatRequestId: chatRequest._id
    });

    const psychicNotification = new Notification({
      recipient: chatRequest.psychic,
      recipientModel: 'Psychic',
      sender: chatRequest.user,
      senderModel: 'User',
      type: 'session_ended',
      title: 'Session Expired',
      message: 'Paid session has expired',
      data: {
        chatRequestId: chatRequest._id,
        totalAmountPaid: chatRequest.totalAmountPaid
      },
      chatRequestId: chatRequest._id
    });

    await Promise.all([
      userNotification.save({ session }),
      psychicNotification.save({ session })
    ]);

    // Emit expiration events
    if (global.io) {
      global.io.to(`user_${chatRequest.user}`).emit('session_expired', {
        requestId: chatRequest._id
      });

      global.io.to(`psychic_${chatRequest.psychic}`).emit('session_expired', {
        requestId: chatRequest._id
      });

      // Emit final wallet update
      const wallet = await Wallet.findOne({ userId: chatRequest.user }).session(session);
      if (wallet) {
        global.io.to(`user_${chatRequest.user}`).emit('wallet_update', {
          balance: wallet.balance,
          credits: wallet.credits || wallet.balance
        });
      }
    }
  }

  // Stop timer
  stopTimer(chatRequestId) {
    if (this.activeTimers.has(chatRequestId)) {
      clearInterval(this.activeTimers.get(chatRequestId));
      this.activeTimers.delete(chatRequestId);
      console.log(`Stopped timer for request ${chatRequestId}`);
    }
  }

  // Pause timer
  pauseTimer(chatRequestId) {
    this.stopTimer(chatRequestId);
  }

  // Resume timer
  async resumeTimer(chatRequestId) {
    const chatRequest = await ChatRequest.findById(chatRequestId);
    if (chatRequest && 
        chatRequest.paidSession.isActive && 
        !chatRequest.paidSession.isPaused &&
        chatRequest.paidSession.remainingSeconds > 0) {
      this.startTimerForRequest(chatRequestId);
    }
  }

  // Format time as MM:SS
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

module.exports = new TimerService();