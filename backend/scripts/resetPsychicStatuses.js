const mongoose = require('mongoose');
require('dotenv').config();

async function resetPsychicStatuses() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    const Psychic = require('../models/HumanChat/Psychic');
    
    // Find psychics that are stuck as busy
    const stuckPsychics = await Psychic.find({
      status: 'online',
      currentSessions: { $gt: 0 }
    });
    
    console.log(`🔍 Found ${stuckPsychics.length} psychics with sessions > 0`);
    
    // Reset all psychics to 0 sessions
    const result = await Psychic.updateMany(
      { status: 'online' },
      { 
        $set: { 
          currentSessions: 0,
          status: 'online',
          availability: true
        } 
      }
    );
    
    console.log(`✅ Reset ${result.modifiedCount} psychics to 0 sessions`);
    
    // Verify the fix
    const updatedPsychics = await Psychic.find({ status: 'online' });
    updatedPsychics.forEach(psychic => {
      console.log(`   - ${psychic.name}: ${psychic.currentSessions} sessions`);
    });
    
    console.log('✅ All psychics have been reset');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
    process.exit(0);
  }
}

resetPsychicStatuses();