const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PsychicEarnings = require('../models/CallSession/PsychicEarnings');
const Psychic = require('../models/HumanChat/Psychic');
const ChatRequest = require('../models/Paidtimer/ChatRequest');
const ActiveCallSession = require('../models/CallSession/ActiveCallSession');

dotenv.config();

async function populatePsychicEarnings() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.DB_MONGODB_URL);
    console.log('✅ Connected to MongoDB');

    // Drop the problematic index first
    try {
      await mongoose.connection.collection('psychicearnings').dropIndex('paymentHistory.paymentId_1');
      console.log('✅ Dropped problematic index');
    } catch (err) {
      console.log('ℹ️ Index may not exist, continuing...');
    }

    // Get all psychics
    const psychics = await Psychic.find({});
    console.log(`📊 Found ${psychics.length} psychics`);

    let successCount = 0;
    let errorCount = 0;

    for (const psychic of psychics) {
      try {
        console.log(`\n🔄 Processing psychic: ${psychic.name} (${psychic._id})`);
        
        // Calculate chat earnings
        const chatEarnings = await ChatRequest.aggregate([
          {
            $match: {
              psychic: psychic._id,
              status: 'completed',
              totalAmountPaid: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalAmountPaid' }
            }
          }
        ]);

        // Calculate call earnings
        const callEarnings = await ActiveCallSession.aggregate([
          {
            $match: {
              psychicId: psychic._id,
              status: 'ended',
              totalCreditsUsed: { $gt: 0 }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalCreditsUsed' }
            }
          }
        ]);

        const chatTotal = chatEarnings[0]?.total || 0;
        const callTotal = callEarnings[0]?.total || 0;
        const totalEarnings = chatTotal + callTotal;

        // Find existing earnings or create new
        let earnings = await PsychicEarnings.findOne({ psychicId: psychic._id });
        
        if (!earnings) {
          // Create with proper empty arrays
          earnings = new PsychicEarnings({
            psychicId: psychic._id,
            totalEarnings: 0,
            totalPaid: 0,
            currentBalance: 0,
            earningsBreakdown: {
              chatEarnings: 0,
              callEarnings: 0
            },
            paymentHistory: [] // Explicitly set empty array
          });
        }

        // Update with calculated values
        earnings.earningsBreakdown.chatEarnings = chatTotal;
        earnings.earningsBreakdown.callEarnings = callTotal;
        earnings.totalEarnings = totalEarnings;
        earnings.currentBalance = totalEarnings - (earnings.totalPaid || 0);
        earnings.lastCalculated = new Date();
        
        await earnings.save();
        
        console.log(`✅ Updated earnings for ${psychic.name}:`);
        console.log(`   - Chat: $${chatTotal}`);
        console.log(`   - Calls: $${callTotal}`);
        console.log(`   - Total: $${totalEarnings}`);
        console.log(`   - Paid: $${earnings.totalPaid || 0}`);
        console.log(`   - Balance: $${earnings.currentBalance}`);
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error processing psychic ${psychic.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Population Summary:');
    console.log(`✅ Successfully processed: ${successCount} psychics`);
    console.log(`❌ Failed: ${errorCount} psychics`);
    
    // Verify the data
    const totalRecords = await PsychicEarnings.countDocuments();
    console.log(`\n📁 Total records in collection: ${totalRecords}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

populatePsychicEarnings();