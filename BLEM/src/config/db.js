const mongoose = require('mongoose');
const env = require('./env');

let memoryServerInstance = null;
let cachedPromise = null;

/**
 * Connect to MongoDB with automatic fallback to in-memory server if local daemon is unreachable
 * @param {string} [customUri] - Optional custom connection string
 * @returns {Promise<typeof mongoose>}
 */
const connectDB = async (customUri) => {
  // If already connected, return current mongoose instance
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  // If connection is already in progress, reuse the pending promise
  if (cachedPromise) {
    return cachedPromise;
  }

  const uri = customUri || env.MONGODB_URI;

  cachedPromise = (async () => {
    try {
      // Attempt standard connection with 5s server selection timeout
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`[DB] Connected to MongoDB at ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
      return mongoose;
    } catch (err) {
      // If we're in development or test, gracefully fall back to mongodb-memory-server
      if (env.NODE_ENV !== 'production') {
        console.warn(`[DB] Could not connect to MongoDB at ${uri}. Initializing in-memory MongoDB instance...`);
        try {
          const { MongoMemoryServer } = require('mongodb-memory-server');
          memoryServerInstance = await MongoMemoryServer.create();
          const memUri = memoryServerInstance.getUri();
          await mongoose.connect(memUri);
          console.log(`[DB] Connected to in-memory MongoDB at ${memUri}`);
          return mongoose;
        } catch (memErr) {
          console.error('[DB] Failed to start in-memory MongoDB instance:', memErr.message);
          throw err;
        }
      }

      console.error(`[DB] MongoDB connection error: ${err.message}`);
      throw err;
    }
  })().catch((err) => {
    cachedPromise = null;
    throw err;
  });

  return cachedPromise;
};

/**
 * Disconnect from MongoDB and stop in-memory server if active
 */
const disconnectDB = async () => {
  cachedPromise = null;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
  }
};

/**
 * Clear all collections (useful for test suites)
 */
const clearDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  clearDatabase
};
