// scripts/fix-psychic-tokens.js
const mongoose = require('mongoose');
const Psychic = require('../models/HumanChat/Psychic');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const fixPsychicTokens = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const psychics = await Psychic.find({});
    console.log(`Found ${psychics.length} psychics`);

    for (const psychic of psychics) {
      // Generate new token with role
      const token = jwt.sign(
        { 
          id: psychic._id, 
          role: 'psychic' 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '30d' }
      );

      console.log(`✅ Fixed token for ${psychic.email}`);
      console.log(`   Token preview: ${token.substring(0, 30)}...`);
      console.log(`   Decoded:`, jwt.decode(token));
    }

    console.log('\n✅ All psychics fixed! They must log in again to get new tokens.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixPsychicTokens();