import mongoose from 'mongoose';

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
export const PAYMENT_STATUSES = ['paid', 'pending', 'refunded'];
export const PAYMENT_METHODS = ['card', 'cash', 'bank_transfer', 'cash_on_delivery', 'wallet'];
export const ORDER_CHANNELS = ['online_store', 'retail', 'wholesale', 'social', 'marketplace'];

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    category: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    cost: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true },
    customer: {
      name: { type: String, required: [true, 'Customer name is required'], trim: true, maxlength: 80 },
      email: { type: String, trim: true, lowercase: true, maxlength: 120, default: '' },
      phone: { type: String, trim: true, maxlength: 30, default: '' },
      address: { type: String, trim: true, maxlength: 240, default: '' },
    },
    items: {
      type: [itemSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'Add at least one product'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'pending' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'card' },
    channel: { type: String, enum: ORDER_CHANNELS, default: 'online_store' },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    timeline: [
      {
        _id: false,
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

orderSchema.index({ owner: 1, orderNumber: 1 }, { unique: true });

export default mongoose.model('Order', orderSchema);
