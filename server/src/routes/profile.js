import { Router } from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { protect, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError, isDataImage, str, toNumber } from '../utils/asyncHandler.js';
import { EMAIL_RE, passwordError } from '../utils/validation.js';
import { notify } from '../utils/notify.js';

const router = Router();
router.use(protect);

const PROFILE_FIELDS = ['name', 'businessName', 'jobTitle', 'phone', 'location', 'website', 'bio'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR', 'AED', 'INR'];

/** Loads the user with the password hash and checks the given password. */
async function verifyPassword(userId, password, field = 'currentPassword') {
  const user = await User.findById(userId).select('+password +tokenVersion');
  if (!password) throw new HttpError(400, 'Enter your current password to continue.', { [field]: 'Enter your password' });
  if (!(await user.comparePassword(password))) {
    throw new HttpError(400, 'Your password is incorrect.', { [field]: 'Password is incorrect' });
  }
  return user;
}

router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    let user = req.user;

    // Changing the sign-in email requires the current password
    const email = str(b.email).trim().toLowerCase();
    if (email && email !== user.email) {
      if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please check the highlighted fields.', { email: 'Enter a valid email address' });
      user = await verifyPassword(user._id, str(b.currentPassword));
      if (await User.exists({ email, _id: { $ne: user._id } })) {
        throw new HttpError(409, 'This email is already in use.', { email: 'This email is already registered' });
      }
      user.email = email;
    }

    for (const key of PROFILE_FIELDS) {
      if (typeof b[key] === 'string') user[key] = b[key].trim();
    }
    if (!user.name || user.name.length < 2) throw new HttpError(400, 'Please check the highlighted fields.', { name: 'Enter your full name' });
    if (user.website && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(user.website)) {
      throw new HttpError(400, 'Please check the highlighted fields.', { website: 'Enter a valid URL' });
    }

    await user.save();
    await notify(user, { type: 'account', title: 'Profile updated', message: 'Your profile details were saved.', link: '/dashboard/settings' });
    res.json({ user: user.toSafeJSON() });
  })
);

router.put(
  '/avatar',
  asyncHandler(async (req, res) => {
    const avatar = str(req.body?.avatar);
    if (avatar && !isDataImage(avatar)) throw new HttpError(400, 'Upload a PNG, JPG or WebP image.');
    if (avatar.length > 1_500_000) throw new HttpError(413, 'Image is too large. Please use one under 1 MB.');
    req.user.avatar = avatar;
    await req.user.save();
    await notify(req.user, {
      type: 'account',
      title: avatar ? 'Profile photo updated' : 'Profile photo removed',
      message: avatar ? 'Your new photo is now visible across your workspace.' : 'Your initials will be shown instead.',
      link: '/dashboard/settings',
    });
    res.json({ user: req.user.toSafeJSON() });
  })
);

router.patch(
  '/preferences',
  asyncHandler(async (req, res) => {
    const p = req.user.preferences || {};
    const b = req.body || {};
    if (b.currency !== undefined) {
      if (!CURRENCIES.includes(b.currency)) throw new HttpError(400, 'Choose a supported currency.');
      p.currency = b.currency;
    }
    if (b.lowStockThreshold !== undefined) p.lowStockThreshold = Math.min(100000, Math.max(0, Math.round(toNumber(b.lowStockThreshold, 10))));
    if (typeof b.skuPrefix === 'string') p.skuPrefix = b.skuPrefix.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4) || 'NV';
    if (b.taxRate !== undefined) p.taxRate = Math.min(100, Math.max(0, toNumber(b.taxRate, 0)));
    for (const k of ['notifyOrders', 'notifyStock', 'notifyProducts', 'notifyAccount']) {
      if (typeof b[k] === 'boolean') p[k] = b[k];
    }
    req.user.preferences = p;
    req.user.markModified('preferences');
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  })
);

router.put(
  '/password',
  asyncHandler(async (req, res) => {
    const newPassword = str(req.body?.newPassword);
    const user = await verifyPassword(req.user._id, str(req.body?.currentPassword));
    const pwErr = passwordError(newPassword);
    if (pwErr) throw new HttpError(400, 'Please check the highlighted fields.', { newPassword: pwErr });

    user.password = newPassword; // the model bumps tokenVersion, revoking every existing session
    await user.save();
    await notify(user, { type: 'account', title: 'Password changed', message: 'Other devices were signed out. If this was not you, reset your password immediately.', link: '/dashboard/settings' });
    // Keep this device signed in with a fresh token
    res.json({ message: 'Password updated', token: signToken(user) });
  })
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const user = await verifyPassword(req.user._id, str(req.body?.password), 'password');
    await Promise.all([
      Product.deleteMany({ owner: user._id }),
      Order.deleteMany({ owner: user._id }),
      Notification.deleteMany({ owner: user._id }),
    ]);
    await User.deleteOne({ _id: user._id });
    res.json({ message: 'Account deleted' });
  })
);

export default router;
