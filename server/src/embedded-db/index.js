// Built-in development database.
//
// Used only when MONGODB_URI is not set (and not in production). It runs a small
// MongoDB wire-compatible server (@rckflr/easydb-server) inside the API process,
// saving data as SQLite files in server/.data via Node's built-in node:sqlite.
// Mongoose talks to it exactly like a real MongoDB, so no app code changes.
//
// Set MONGODB_URI (local MongoDB or Atlas) and this file is never loaded.
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

function portFree(port, host) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, host);
  });
}

/**
 * Starts the embedded database and resolves with a MongoDB connection string.
 * @param {{ port?: number, dataDir?: string, memory?: boolean }} options
 */
export async function startEmbeddedDb({ port = 27018, dataDir = path.join(serverRoot, '.data'), memory = false } = {}) {
  const host = '127.0.0.1';
  let modules;
  try {
    const [{ createServer }, { dbManager }, { setLogLevel }] = await Promise.all([
      import('@rckflr/easydb-server/src/server.js'),
      import('@rckflr/easydb-server/src/storage/database-manager.js'),
      import('@rckflr/easydb-server/src/utils/logger.js'),
    ]);
    modules = { createServer, dbManager, setLogLevel };
  } catch (err) {
    throw new Error(
      `MONGODB_URI is not set and the built-in dev database is not installed (${err.code || err.message}). ` +
        'Run "npm install" in server/ (with dev dependencies) or set MONGODB_URI.'
    );
  }

  const { createServer, dbManager, setLogLevel } = modules;
  setLogLevel(process.env.EMBEDDED_DB_LOG || 'warn');

  if (memory) {
    const { MemoryAdapter } = await import('@rckflr/easydb');
    dbManager.configure('memory', () => new MemoryAdapter());
  } else {
    const { SQLiteAdapter } = await import('@rckflr/easydb/adapters/sqlite');
    fs.mkdirSync(dataDir, { recursive: true });
    dbManager.configure('sqlite', (name) => new SQLiteAdapter(path.join(dataDir, `${name.replace(/[^a-zA-Z0-9._-]/g, '_')}.sqlite`)));
  }
  await dbManager.initialize();

  if (!(await portFree(port, host))) {
    throw new Error(`Port ${port} is busy, so the built-in dev database cannot start. Set EMBEDDED_DB_PORT or MONGODB_URI.`);
  }
  await new Promise((resolve, reject) => {
    const srv = createServer({ port, host });
    srv.once('listening', resolve);
    srv.once('error', reject);
  });

  console.log(`[novara] Built-in dev database on ${host}:${port} (${memory ? 'in memory' : `saved to ${path.relative(serverRoot, dataDir)}/`})`);
  return `mongodb://${host}:${port}/novara`;
}
