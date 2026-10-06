import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const preferencesSchema = new mongoose.Schema(
  {
    currency: { type: String, enum: ['USD', 'EUR', 'GBP', 'PKR', 'AED', 'INR'], default: 'USD' },
    lowStockThreshold: { type: Number, min: 0, max: 100000, default: 10 },
    skuPrefix: { type: String, trim: true, uppercase: true, maxlength: 4, default: 'NV' },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    notifyOrders: { type: Boolean, default: true },
    notifyStock: { type: Boolean, default: true },
    notifyProducts: { type: Boolean, default: true },
    notifyAccount: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Enter a valid email address'],
    },
    password: { type: String, required: true, minlength: 8, select: false },
    businessName: { type: String, trim: true, maxlength: 80, default: '' },
    jobTitle: { type: String, trim: true, maxlength: 80, default: 'Owner' },
    phone: { type: String, trim: true, maxlength: 30, default: '' },
    location: { type: String, trim: true, maxlength: 80, default: '' },
    website: { type: String, trim: true, maxlength: 120, default: '' },
    bio: { type: String, trim: true, maxlength: 280, default: '' },
    avatar: { type: String, default: '' },
    preferences: { type: preferencesSchema, default: () => ({}) },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 11);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeJSON = function toSafeJSON() {
  const obj = this.toObject({ versionKey: false });
  delete obj.password;
  obj.id = String(obj._id);
  return obj;
};

export default mongoose.model('User', userSchema);
