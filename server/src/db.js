import mongoose from 'mongoose';
import { config } from './config.js';

mongoose.set('strictQuery', true);

export async function connectDB(retries = 10) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 4000 });
      console.log(`[novara] MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
      return;
    } catch (err) {
      console.error(`[novara] MongoDB connection failed (attempt ${attempt}/${retries}): ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}
