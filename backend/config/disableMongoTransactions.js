// Emergency patch to completely disable MongoDB transactions
module.exports = function disableMongoTransactions() {
  console.log('🚫 Applying MongoDB transaction emergency patch...');
  
  // Patch mongoose connection
  const mongoose = require('mongoose');
  
  // 1. Prevent any session creation in mongoose
  const originalStartSession = mongoose.startSession;
  mongoose.startSession = function(options = {}) {
    console.warn('⚠️ [Mongoose] startSession() called - returning complete dummy session');
    
    // Create a complete dummy session with all required properties
    const dummySession = {
      // Session methods
      startTransaction: async (txnOptions) => {
        console.warn('⚠️ [Mongoose] startTransaction() blocked');
        return this;
      },
      
      commitTransaction: async () => {
        console.warn('⚠️ [Mongoose] commitTransaction() blocked');
      },
      
      abortTransaction: async () => {
        console.warn('⚠️ [Mongoose] abortTransaction() blocked');
      },
      
      endSession: async (options) => {
        console.log('✅ [Mongoose] Dummy session ended');
      },
      
      // Session properties
      inTransaction: () => false,
      hasEnded: () => false,
      options: options || {},
      
      // Required MongoDB properties
      id: { id: Buffer.from('mongoose-dummy-session') },
      serverSession: { 
        lsid: { id: Buffer.from('mongoose-dummy-session') },
        txnNumber: null,
        isDirty: false
      },
      clusterTime: null,
      operationTime: null,
      snapshotEnabled: false,
      snapshotTime: null,
      causalConsistency: true,
      defaultTransactionOptions: {},
      
      // Required for cursor operations
      get client() {
        return {
          topology: {
            s: {
              options: {}
            }
          }
        };
      },
      
      // Make it look like a real session
      get session() {
        return this;
      }
    };
    
    return Promise.resolve(dummySession);
  };
  
  // 2. Patch the MongoDB driver directly with a BETTER dummy session
  try {
    const mongodb = require('mongodb');
    const originalMongoStartSession = mongodb.MongoClient.prototype.startSession;
    
    mongodb.MongoClient.prototype.startSession = function(options = {}) {
      console.warn('⚠️ [MongoDB Driver] startSession() called - returning safe dummy session');
      
      // Create a more complete dummy session
      const dummySession = {
        // Basic session methods
        startTransaction: async (txnOptions) => {
          console.warn('⚠️ [MongoDB Driver] startTransaction() blocked');
          return this;
        },
        
        commitTransaction: async () => {
          console.warn('⚠️ [MongoDB Driver] commitTransaction() blocked');
        },
        
        abortTransaction: async () => {
          console.warn('⚠️ [MongoDB Driver] abortTransaction() blocked');
        },
        
        endSession: async (options) => {
          console.log('✅ [MongoDB Driver] Dummy session ended');
        },
        
        // Required properties
        inTransaction: () => false,
        hasEnded: () => false,
        options: options || {},
        
        // MongoDB driver required properties
        id: { id: Buffer.from('mongodb-dummy-session') },
        serverSession: { 
          lsid: { id: Buffer.from('mongodb-dummy-session') },
          txnNumber: null,
          isDirty: false
        },
        clusterTime: null,
        operationTime: null,
        snapshotEnabled: false,
        snapshotTime: null,
        causalConsistency: true,
        defaultTransactionOptions: {},
        
        // Client/topology properties to prevent errors
        client: {
          topology: {
            s: {
              options: {
                hosts: [{ host: 'localhost', port: 27017 }],
                credentials: {},
                metadata: {}
              }
            },
            isDestroyed: () => false,
            destroy: () => Promise.resolve()
          },
          s: {
            options: {
              retryWrites: false
            }
          }
        },
        
        // Pinned connection properties
        pinnedConnection: null,
        pin: () => {},
        unpin: () => {}
      };
      
      return Promise.resolve(dummySession);
    };
    
    console.log('✅ MongoDB driver patched successfully');
  } catch (err) {
    console.warn('⚠️ Could not patch MongoDB driver:', err.message);
  }
  
  console.log('✅ MongoDB transactions emergency patch applied');
  
  // 3. Add a global error handler for session-related errors
  process.on('unhandledRejection', (reason, promise) => {
    if (reason.message && reason.message.includes('session') || 
        reason.message && reason.message.includes('topology')) {
      console.warn('⚠️ Caught session/topology error:', reason.message);
      console.warn('This is expected when blocking transactions');
    }
  });
};