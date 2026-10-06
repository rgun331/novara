import { config } from './config.js';
import { connectDB, disconnectDB } from './db.js';
import { app } from './app.js';
import { runMigrations } from './migrations.js';

process.on('unhandledRejection', (err) => {
  console.error('[novara] Unhandled promise rejection:', err);
});

async function start() {
  try {
    await connectDB();
  } catch (err) {
    console.error('[novara] Could not connect to MongoDB. Check MONGO_URI and your Atlas network access list.', err.message);
    process.exit(1);
  }

  try {
    await runMigrations();
  } catch (err) {
    console.error('[novara] Startup migration failed (continuing):', err.message);
  }

  const server = app.listen(config.port, config.host, () => {
    console.log(`[novara] Listening on http://${config.host}:${config.port} (${config.isProd ? 'production' : 'development'}${config.serveClient ? ', serving client' : ', API only'})`);
  });

  // Graceful shutdown: stop accepting connections, finish in-flight requests, close the DB pool
  let closing = false;
  const shutdown = (signal) => {
    if (closing) return;
    closing = true;
    console.log(`[novara] ${signal} received, shutting down`);
    const force = setTimeout(() => process.exit(1), 10_000);
    force.unref();
    server.close(async () => {
      await disconnectDB().catch(() => {});
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
