const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const CreditDeduction = require('../models/CallSession/CreditDeduction');

class CreditService {
  /**
   * Deduct credits for call time
   */
 async deductCredits(userId, creditsToDeduct, callInfo) {
  try {
    console.log(`💳 Attempting to deduct ${creditsToDeduct} credits from user ${userId}`);
    
    // Find and update wallet WITHOUT transactions
    const wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      console.error(`❌ Wallet not found for user ${userId}`);
      throw new Error('Wallet not found');
    }
    
    const creditsBefore = wallet.credits;
    
    // Check if user has enough credits
    if (wallet.credits < creditsToDeduct) {
      console.log(`❌ Insufficient credits: Has ${wallet.credits}, Needs ${creditsToDeduct}`);
      return {
        success: false,
        message: 'Insufficient credits',
        creditsBefore,
        creditsAfter: creditsBefore,
        creditsNeeded: creditsToDeduct,
        creditsAvailable: wallet.credits
      };
    }
    
    // Deduct credits using atomic operation
    const updatedWallet = await Wallet.findOneAndUpdate(
      { userId, credits: { $gte: creditsToDeduct } },
      { $inc: { credits: -creditsToDuct } },
      { new: true }
    );
    
    if (!updatedWallet) {
      console.error(`❌ Failed to deduct credits from user ${userId}`);
      throw new Error('Failed to update wallet');
    }
    
    console.log(`✅ Successfully deducted ${creditsToDeduct} credits from user ${userId}`);
    
    // Create credit deduction record WITHOUT transactions
    const deductionRecord = new CreditDeduction({
      callSessionId: callInfo.callSessionId,
      userId: userId,
      psychicId: callInfo.psychicId,
      creditsDeducted: creditsToDeduct,
      deductionTime: new Date(),
      ratePerMin: callInfo.ratePerMin,
      durationSeconds: callInfo.durationSeconds,
      creditsBefore: creditsBefore,
      creditsAfter: updatedWallet.credits,
      status: 'success'
    });
    
    await deductionRecord.save();
    
    return {
      success: true,
      message: 'Credits deducted successfully',
      creditsBefore,
      creditsAfter: updatedWallet.credits,
      creditsDeducted: creditsToDeduct,
      deductionRecordId: deductionRecord._id
    };
    
  } catch (error) {
    console.error('❌ Error deducting credits:', error);
    throw error;
  }
}
  /**
   * Deduct credits per minute (real-time)
   */
  async deductCreditsPerMinute(callSessionId) {
    const callSession = await mongoose.model('CallSession').findById(callSessionId);
    
    if (!callSession) {
      throw new Error('Call session not found');
    }
    
    const creditsToDeduct = callSession.creditsPerMin;
    
    const result = await this.deductCredits(callSession.userId, creditsToDeduct, {
      callSessionId: callSession._id,
      psychicId: callSession.psychicId,
      ratePerMin: callSession.ratePerMin,
      durationSeconds: 60 // One minute
    });
    
    if (result.success) {
      // Update call session with total credits used
      callSession.totalCreditsUsed += creditsToDeduct;
      callSession.lastBilledAt = new Date();
      await callSession.save();
    }
    
    return result;
  }

  /**
   * Check if user has enough credits for a call
   */
  async checkCredits(userId, durationMinutes, creditsPerMin) {
    const wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      return {
        hasEnough: false,
        message: 'Wallet not found',
        available: 0,
        required: durationMinutes * creditsPerMin
      };
    }
    
    const requiredCredits = durationMinutes * creditsPerMin;
    const hasEnough = wallet.credits >= requiredCredits;
    
    return {
      hasEnough,
      message: hasEnough ? 'Sufficient credits' : 'Insufficient credits',
      available: wallet.credits,
      required: requiredCredits,
      canProceed: hasEnough
    };
  }

  /**
   * Refund credits (if call fails or is cancelled)
   */
  async refundCredits(deductionRecordId) {
    try {
      // Find deduction record WITHOUT session
      const deduction = await CreditDeduction.findById(deductionRecordId);
      
      if (!deduction || deduction.status === 'refunded') {
        throw new Error('Invalid deduction record or already refunded');
      }
      
      // Add credits back to wallet WITHOUT session
      const wallet = await Wallet.findOne({ userId: deduction.userId });
      
      if (!wallet) {
        throw new Error('Wallet not found');
      }
      
      wallet.credits += deduction.creditsDeducted;
      await wallet.save();
      
      // Update deduction record WITHOUT session
      deduction.status = 'refunded';
      await deduction.save();
      
      return {
        success: true,
        message: 'Credits refunded successfully',
        creditsRefunded: deduction.creditsDeducted,
        newBalance: wallet.credits
      };
      
    } catch (error) {
      console.error('Error refunding credits:', error);
      throw error;
    }
  }

  /**
   * Get user's credit balance
   */
  async getUserCredits(userId) {
    const wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      return {
        credits: 0,
        message: 'Wallet not found'
      };
    }
    
    return {
      credits: wallet.credits,
      lastUpdated: wallet.updatedAt
    };
  }
}

module.exports = new CreditService();