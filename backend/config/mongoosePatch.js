// This file patches Mongoose to completely disable transactions
const mongoose = require('mongoose');

console.log('🔧 Patching Mongoose to disable all transactions...');

// Store original methods for debugging
const originalStartSession = mongoose.startSession;

// 1. Completely override startSession to return a dummy session
mongoose.startSession = async function(options) {
  console.warn('🚫 [Transaction Blocked] mongoose.startSession() called - returning dummy session');
  console.log('📋 Call stack:', new Error().stack.split('\n').slice(2, 6).join('\n'));
  
  // Create a complete dummy session that mimics real session
  const dummySession = {
    // Session methods
    startTransaction: async () => {
      console.warn('🚫 [Transaction Blocked] startTransaction() called - no-op');
    },
    commitTransaction: async () => {
      console.warn('🚫 [Transaction Blocked] commitTransaction() called - no-op');
    },
    abortTransaction: async () => {
      console.warn('🚫 [Transaction Blocked] abortTransaction() called - no-op');
    },
    endSession: async () => {
      console.log('✅ Dummy session ended');
    },
    
    // Session properties
    inTransaction: () => false,
    hasEnded: () => false,
    
    // Make it look like a real session to Mongoose
    session: null, // Self-reference trick
    
    // Methods to handle session attachment
    getOptions: () => ({}),
    getServerSession: () => null,
    
    // BSON serialization
    toBSON: () => ({ id: 'dummy-session' }),
    
    // MongoDB driver properties
    id: { id: Buffer.from('dummy-session-id') },
    serverSession: { 
      lsid: { id: Buffer.from('dummy-session-id') },
      txnNumber: null
    },
    clusterTime: null,
    operationTime: null,
    snapshotEnabled: false,
    causalConsistency: true,
    
    // Make it iterable
    [Symbol.asyncIterator]: function* () {
      yield this;
    }
  };
  
  // Self-reference
  dummySession.session = dummySession;
  
  return dummySession;
};

// 2. Patch Query class to remove sessions from all queries
const Query = mongoose.Query;
const Model = mongoose.Model;

// Patch Query.prototype.getOptions to remove session
const originalGetOptions = Query.prototype.getOptions;
Query.prototype.getOptions = function() {
  const options = originalGetOptions.call(this);
  if (options && options.session) {
    console.warn('🚫 Removing session from query options');
    delete options.session;
  }
  return options;
};

// Patch Query.prototype.exec to ensure no session
const originalExec = Query.prototype.exec;
Query.prototype.exec = function(op, callback) {
  // Remove session from the query
  if (this._session) {
    console.warn('🚫 Removing session from query before execution');
    delete this._session;
  }
  
  // Also remove from options
  const options = this.getOptions();
  if (options && options.session) {
    delete options.session;
  }
  
  return originalExec.call(this, op, callback);
};

// 3. Patch Model.prototype.save to ignore sessions
const originalSave = Model.prototype.save;
Model.prototype.save = function(options, callback) {
  // Remove session from options
  if (options && typeof options === 'object' && options.session) {
    console.warn('🚫 Removing session from save() options');
    delete options.session;
  }
  
  // Also remove $session from the document
  if (this.$session) {
    console.warn('🚫 Removing $session from document');
    this.$session = null;
  }
  
  return originalSave.call(this, options, callback);
};

// 4. Patch all static model methods that might accept sessions
const methodsToPatch = [
  'find', 'findOne', 'findById', 'findOneAndUpdate', 'findOneAndDelete',
  'updateOne', 'updateMany', 'deleteOne', 'deleteMany',
  'countDocuments', 'estimatedDocumentCount', 'distinct',
  'aggregate', 'bulkWrite'
];

methodsToPatch.forEach(methodName => {
  if (Model[methodName]) {
    const originalMethod = Model[methodName];
    Model[methodName] = function(...args) {
      // Check if last argument is options with session
      const lastArg = args[args.length - 1];
      if (lastArg && typeof lastArg === 'object' && lastArg.session) {
        console.warn(`🚫 Removing session from ${methodName}()`);
        delete lastArg.session;
      }
      return originalMethod.apply(this, args);
    };
  }
});

// 5. Patch connection to disable transactions at driver level
const Connection = mongoose.Connection;

// This is the nuclear option - patch the MongoDB driver directly
const MongoClient = require('mongodb').MongoClient;
const originalStartSessionMongo = MongoClient.prototype.startSession;

MongoClient.prototype.startSession = function(options) {
  console.warn('🚫 [MongoDB Driver] Blocking startSession at driver level');
  
  return {
    startTransaction: () => console.warn('🚫 Transaction blocked at driver level'),
    commitTransaction: () => console.warn('🚫 Commit blocked at driver level'),
    abortTransaction: () => console.warn('🚫 Abort blocked at driver level'),
    endSession: () => console.log('✅ Driver session ended'),
    inTransaction: () => false,
    getOptions: () => ({}),
    serverSession: { lsid: { id: Buffer.from('driver-dummy') } }
  };
};

console.log('✅ MongoDB transactions and sessions completely disabled for standalone setup');