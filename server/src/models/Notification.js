import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['order', 'stock', 'product', 'account', 'system'], default: 'system' },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, maxlength: 400, default: '' },
    link: { type: String, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
