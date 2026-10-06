import mongoose from 'mongoose';
import { config } from './config.js';

mongoose.set('strictQuery', true);

async function resolveUri() {
  if (config.mongoUri) return config.mongoUri;
  if (config.embeddedDb) {
    const { startEmbeddedDb } = await import('./embedded-db/index.js');
    return startEmbeddedDb({ port: config.embeddedDbPort, memory: process.env.EMBEDDED_DB_MEMORY === 'true' });
  }
  throw new Error('MONGODB_URI is not set. Add it to server/.env (local MongoDB or Atlas).');
}

export async function connectDB(retries = 10) {
  const uri = await resolveUri();
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
      console.log(`[novara] MongoDB connected: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
      return;
    } catch (err) {
      console.error(`[novara] MongoDB connection failed (attempt ${attempt}${Number.isFinite(retries) ? `/${retries}` : ''}): ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}
