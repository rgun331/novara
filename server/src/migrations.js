import Product from './models/Product.js';
import User from './models/User.js';

/**
 * Small idempotent data migrations, run on startup. Each one only touches documents
 * that still need it, so after the first run they are cheap no-ops.
 */
export async function runMigrations() {
  // Images saved before image URLs existed need a version timestamp so they are served
  const now = new Date();
  const [p, u] = await Promise.all([
    Product.updateMany({ imageUpdatedAt: { $in: [null] }, image: { $gt: '' } }, { $set: { imageUpdatedAt: now } }),
    User.updateMany({ avatarUpdatedAt: { $in: [null] }, avatar: { $gt: '' } }, { $set: { avatarUpdatedAt: now } }),
  ]);
  const changed = (p.modifiedCount || 0) + (u.modifiedCount || 0);
  if (changed) console.log(`[novara] Migrated ${changed} stored image(s) to image URLs`);
}
