import mongoose from 'mongoose';

export const PRODUCT_CATEGORIES = [
  'Apparel',
  'Accessories',
  'Home & Living',
  'Beauty',
  'Electronics',
  'Food & Beverage',
  'Stationery',
  'Health',
  'Sports',
  'Other',
];

const productSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 120 },
    sku: { type: String, required: [true, 'SKU is required'], trim: true, uppercase: true, maxlength: 40 },
    category: { type: String, required: [true, 'Category is required'], trim: true, maxlength: 40 },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    cost: { type: Number, min: [0, 'Cost cannot be negative'], default: 0 },
    stock: { type: Number, required: true, min: [0, 'Stock cannot be negative'], default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 10 },
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
    supplier: { type: String, trim: true, maxlength: 80, default: '' },
    tags: [{ type: String, trim: true, maxlength: 24 }],
    // Stored as a data URL but never loaded by default; clients fetch it from imageUrl
    image: { type: String, default: '', select: false },
    imageUpdatedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.image;
        delete ret.imageUpdatedAt;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

productSchema.index({ owner: 1, sku: 1 }, { unique: true });
productSchema.index({ owner: 1, createdAt: -1 });

productSchema.virtual('stockStatus').get(function stockStatus() {
  if (this.stock <= 0) return 'out';
  if (this.stock <= this.lowStockThreshold) return 'low';
  return 'in';
});

// Versioned so browsers can cache the image forever and still pick up changes
productSchema.virtual('imageUrl').get(function imageUrl() {
  return this.imageUpdatedAt ? `/api/products/${this._id}/image?v=${new Date(this.imageUpdatedAt).getTime()}` : '';
});

export default mongoose.model('Product', productSchema);
