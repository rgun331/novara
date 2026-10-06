import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['order', 'stock', 'product', 'account', 'system'], default: 'system' },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, maxlength: 400, default: '' },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ owner: 1, createdAt: -1 });
// Old notifications are removed automatically by MongoDB after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.model('Notification', notificationSchema);
