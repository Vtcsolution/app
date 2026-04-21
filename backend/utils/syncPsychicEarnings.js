const PsychicEarnings = require('../models/CallSession/PsychicEarnings');
const ChatRequest = require('../models/Paidtimer/ChatRequest');
const ActiveCallSession = require('../models/CallSession/ActiveCallSession');

/**
 * Sync a psychic's earnings with the database
 * This should be called whenever a chat or call is completed
 */
const syncPsychicEarnings = async (psychicId) => {
  try {
    if (!psychicId) return null;
    
    // Get or create earnings record
    let earnings = await PsychicEarnings.findOne({ psychicId });
    
    if (!earnings) {
      earnings = new PsychicEarnings({
        psychicId,
        totalEarnings: 0,
        totalPaid: 0,
        currentBalance: 0,
        earningsBreakdown: { chatEarnings: 0, callEarnings: 0 },
        paymentHistory: []
      });
    }
    
    // Update with latest data
    await earnings.updateEarnings();
    
    console.log(`✅ Synced earnings for psychic ${psychicId}`);
    return earnings;
  } catch (error) {
    console.error(`❌ Error syncing earnings for psychic ${psychicId}:`, error);
    return null;
  }
};

/**
 * Sync all psychics' earnings (for admin use)
 */
const syncAllPsychicsEarnings = async () => {
  try {
    const Psychic = require('../models/HumanChat/Psychic');
    const psychics = await Psychic.find({});
    
    const results = [];
    for (const psychic of psychics) {
      const earnings = await syncPsychicEarnings(psychic._id);
      results.push({
        psychicId: psychic._id,
        name: psychic.name,
        totalEarnings: earnings?.totalEarnings || 0,
        psychicShare: earnings ? earnings.totalEarnings * 0.25 : 0
      });
    }
    
    console.log(`✅ Synced earnings for ${results.length} psychics`);
    return results;
  } catch (error) {
    console.error('❌ Error syncing all psychics:', error);
    return [];
  }
};

module.exports = {
  syncPsychicEarnings,
  syncAllPsychicsEarnings
};