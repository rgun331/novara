import mongoose from 'mongoose';
import { config } from './config.js';

mongoose.set('strictQuery', true);

/** Hides the user and password when a connection string is logged. */
const redact = (uri) => uri.replace(/\/\/[^@/]+@/, '//***@');

let closing = false;
mongoose.connection.on('disconnected', () => !closing && console.warn('[novara] MongoDB disconnected, the driver will keep retrying'));
mongoose.connection.on('reconnected', () => console.log('[novara] MongoDB reconnected'));
mongoose.connection.on('error', (err) => console.error('[novara] MongoDB error:', err.message));

export async function connectDB({ retries = 5 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 10_000,
        maxPoolSize: 10,
        // Builds the schema indexes (unique email, owner+sku, owner+orderNumber) if missing; idempotent
        autoIndex: true,
      });
      const { host, name } = mongoose.connection;
      console.log(`[novara] MongoDB connected: ${host}/${name}`);
      if (name === 'test') {
        console.warn('[novara] MONGO_URI has no database name, so data goes to "test". Add one before the "?", e.g. ...mongodb.net/novara?retryWrites=true');
      }
      return;
    } catch (err) {
      console.error(`[novara] MongoDB connection failed (attempt ${attempt}/${retries}) to ${redact(config.mongoUri)}: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

export async function disconnectDB() {
  closing = true;
  await mongoose.connection.close();
}
