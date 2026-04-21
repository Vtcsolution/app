const mongoose = require("mongoose");
const ActiveSession = require("../models/ActiveSession");
const Wallet = require("../models/Wallet");
const User = require("../models/User");

const freeMinutes = 1;

const checkAndUpdateTimer = async (userId, psychicId) => {
  const now = new Date();
  const user = await User.findById(userId);

  // Check if user has a free minute
  if (!user.hasUsedFreeMinute) {
    let session = await ActiveSession.findOne({ userId, psychicId });

    if (!session) {
      session = await ActiveSession.create({
        userId,
        psychicId,
        startTime: now,
        freeEndTime: new Date(now.getTime() + freeMinutes * 60000),
        remainingFreeTime: freeMinutes * 60,
        lastChargeTime: now,
        freeSessionUsed: false,
        isArchived: false,
      });
    }

    if (now < session.freeEndTime) {
      console.log(`[Timer] Free session active for user ${userId}: ${session.remainingFreeTime} seconds remaining`);
      return { available: true, isFree: true, message: "Free minute active" };
    }

    // Mark free minute as used
    await User.updateOne({ _id: userId }, { hasUsedFreeMinute: true });
    session.freeSessionUsed = true;
    session.isArchived = true;
    await session.save();
  }

  // Check wallet for paid session
  const wallet = await Wallet.findOne({ userId });
  if (!wallet || wallet.credits <= 0) {
    console.log(`[Timer] No credits available for user ${userId}`);
    return { available: false, message: "Purchase credits to continue chatting." };
  }

  let session = await ActiveSession.findOne({ userId, psychicId });
  if (!session) {
    session = await ActiveSession.create({
      userId,
      psychicId,
      startTime: now,
      lastChargeTime: now,
      freeSessionUsed: true,
      isArchived: false,
      paidSession: true,
      paidStartTime: now,
      initialCredits: wallet.credits, // Initialize with current credits
    });
    console.log(`[Timer] New paid session created for user ${userId} with ${wallet.credits} credits`);
  }

  // Check if paid session is active
  if (session.paidSession && session.paidStartTime) {
    const secondsSinceStart = Math.floor((now - session.paidStartTime) / 1000);
    const remainingTime = session.initialCredits * 60 - secondsSinceStart;

    console.log(`[Timer] Paid session check for user ${userId}: ${remainingTime} seconds remaining, initialCredits: ${session.initialCredits}`);

    if (remainingTime > 0) {
      return { available: true, isFree: false, remainingTime };
    }

    // If time is up, try to deduct more credits to extend session
    if (wallet.credits >= 1) {
      await Wallet.updateOne(
        { userId, lock: false },
        { $inc: { credits: -1 }, $set: { lock: false } }
      );
      session.paidStartTime = now; // Reset timer for new credit
      session.initialCredits = 1; // Allocate 1 credit for new period
      await session.save();
      console.log(`[Timer] Extended paid session for user ${userId} with 1 new credit`);
      return { available: true, isFree: false, remainingTime: 60 };
    }

    // No credits left to extend session
    await ActiveSession.updateOne(
      { _id: session._id },
      { paidSession: false, paidStartTime: null, isArchived: true }
    );
    console.log(`[Timer] Paid session expired for user ${userId}`);
    return { available: false, message: "Purchase credits to continue chatting." };
  }

  // Start new paid session if credits available
  const minutesToCharge = Math.ceil((now - session.lastChargeTime) / 60000);
  if (minutesToCharge >= 1) {
    if (wallet.credits < minutesToCharge) {
      console.log(`[Timer] Insufficient credits for user ${userId}: need ${minutesToCharge}, have ${wallet.credits}`);
      return { available: false, message: "Purchase credits to continue chatting." };
    }
    await Wallet.updateOne(
      { userId, lock: false },
      { $inc: { credits: -minutesToCharge }, $set: { lock: false } }
    );
    session.lastChargeTime = now;
    session.paidSession = true;
    session.paidStartTime = now;
    session.initialCredits = minutesToCharge; // Set initialCredits for new paid session
    await session.save();
    console.log(`[Timer] Deducted ${minutesToCharge} credits for user ${userId}, new paid session started`);
  }

  return { available: true, isFree: false, remainingTime: session.initialCredits * 60 };
};

module.exports = { checkAndUpdateTimer };