const app = require('./app');
const env = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const seedData = require('./config/seed');

let server;

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Auto-seed demo data if database is fresh
    if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
      await seedData();
    }

    server = app.listen(env.PORT, () => {
      console.log('====================================================');
      console.log(`🚀 BLEM Mini Social Media MVP running in [${env.NODE_ENV}] mode`);
      console.log(`📡 Server listening on http://localhost:${env.PORT}`);
      console.log(`🌐 Public Web UI available at http://localhost:${env.PORT}`);
      console.log(`📑 Healthcheck at http://localhost:${env.PORT}/api/health`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('Failed to initialize BLEM server:', err.message);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`\n[${signal}] Received shutdown signal. Closing gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('HTTP server closed.');
      await disconnectDB();
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  } else {
    await disconnectDB();
    process.exit(0);
  }
};

if (require.main === module) {
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  startServer();
}

module.exports = app;
