const app = require('./app');
const config = require('./config/config');
const { connectDB, disconnectDB } = require('./config/db');
const Product = require('./models/Product');
const { seedData } = require('./utils/seed');

let server;

async function startServer() {
  try {
    console.log('[Server] Connecting to database...');
    await connectDB();

    // Auto-seed if database is empty so developer immediately sees a functional catalog
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('[Server] Database is empty. Seeding initial products and users...');
      await seedData();
    }

    server = app.listen(config.port, () => {
      console.log(`\n=================================================`);
      console.log(`🚀 E-Commerce Server running on http://localhost:${config.port}`);
      console.log(`📦 Environment: ${config.nodeEnv}`);
      console.log(`✨ Features: Auth, Catalog, Cart, Details, Orders`);
      console.log(`=================================================\n`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      if (server) {
        server.close(async () => {
          console.log('[Server] HTTP server closed.');
          await disconnectDB();
          process.exit(0);
        });
      } else {
        await disconnectDB();
        process.exit(0);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
  } catch (err) {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer
};
