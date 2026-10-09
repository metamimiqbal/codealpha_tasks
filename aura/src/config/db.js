const mongoose = require('mongoose');
const config = require('./config');

let memoryServer = null;

/**
 * Connect to MongoDB with fallback to MongoMemoryServer if no URI is provided
 * or if local server is unreachable during development.
 */
async function connectDB(customUri = null) {
  const targetUri = customUri || config.mongoUri;

  if (targetUri) {
    try {
      await mongoose.connect(targetUri, {
        serverSelectionTimeoutMS: 3000
      });
      console.log(`[DB] Connected to MongoDB at: ${targetUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')}`);
      return mongoose.connection;
    } catch (err) {
      console.warn(`[DB] Failed to connect to specified URI: ${err.message}`);
      if (config.nodeEnv === 'production') {
        throw err;
      }
      console.log('[DB] Falling back to embedded in-memory MongoDB...');
    }
  }

  // Fallback to MongoMemoryServer for development / testing
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    if (!memoryServer) {
      memoryServer = await MongoMemoryServer.create();
    }
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    console.log(`[DB] Connected to in-memory MongoDB instance.`);
    return mongoose.connection;
  } catch (memErr) {
    console.error('[DB] Error initializing in-memory MongoDB:', memErr.message);
    throw memErr;
  }
}

/**
 * Disconnect and clean up MongoDB connections.
 */
async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    console.log('[DB] Disconnected from database.');
  } catch (err) {
    console.error('[DB] Disconnect error:', err.message);
  }
}

module.exports = {
  connectDB,
  disconnectDB
};
