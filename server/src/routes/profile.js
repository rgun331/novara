import { Router } from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Notification from '../models/Notification.js';
import { asyncHandler, HttpError, isDataImage, str, toNumber } from '../utils/asyncHandler.js';
import { protect, signToken } from '../middleware/auth.js';
import { DEMO } from '../seed.js';
import { notify } from '../utils/notify.js';

const router = Router();
router.use(protect);

// The shared demo login must keep working for everyone
const isDemo = (user) => user.email === DEMO.email;
const DEMO_LOCKED = 'The demo account email and password cannot be changed. Sign up to get your own workspace.';

const PROFILE_FIELDS = ['name', 'businessName', 'jobTitle', 'phone', 'location', 'website', 'bio'];

router.patch(
  '/',
  asyncHandler(async (req, res) => {
    const user = req.user;
    for (const key of PROFILE_FIELDS) {
      if (typeof req.body[key] === 'string') user[key] = req.body[key].trim();
    }
    if (typeof req.body.email === 'string' && req.body.email.trim().toLowerCase() !== user.email) {
      if (isDemo(user)) throw new HttpError(403, DEMO_LOCKED, { email: 'Locked on the demo account' });
      const email = req.body.email.trim().toLowerCase();
      const taken = await User.exists({ email, _id: { $ne: user._id } });
      if (taken) throw new HttpError(409, 'This email is already in use.', { email: 'This email is already registered' });
      user.email = email;
    }
    if (!user.name || user.name.length < 2) throw new HttpError(400, 'Please check the highlighted fields.', { name: 'Enter your full name' });
    await user.save();
    await notify(user, { type: 'account', title: 'Profile updated', message: 'Your profile details were saved.', link: '/dashboard/settings' });
    res.json({ user: user.toSafeJSON() });
  })
);

router.put(
  '/avatar',
  asyncHandler(async (req, res) => {
    const { avatar } = req.body || {};
    if (avatar !== '' && !isDataImage(avatar)) throw new HttpError(400, 'Upload a PNG, JPG or WebP image.');
    if (avatar && avatar.length > 1_500_000) throw new HttpError(413, 'Image is too large. Please use one under 1 MB.');
    req.user.avatar = avatar || '';
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
    if (b.currency) p.currency = b.currency;
    if (b.lowStockThreshold !== undefined) p.lowStockThreshold = Math.max(0, Math.round(toNumber(b.lowStockThreshold, 10)));
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
    const currentPassword = str(req.body?.currentPassword);
    const newPassword = str(req.body?.newPassword);
    if (isDemo(req.user)) throw new HttpError(403, DEMO_LOCKED);
    const user = await User.findById(req.user._id).select('+password +tokenVersion');
    if (!(await user.comparePassword(currentPassword))) {
      throw new HttpError(400, 'Current password is incorrect.', { currentPassword: 'Current password is incorrect' });
    }
    if (newPassword.length < 8 || newPassword.length > 128 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      throw new HttpError(400, 'Please check the highlighted fields.', { newPassword: 'Use 8+ characters with letters and numbers' });
    }
    user.password = newPassword;
    await user.save();
    await notify(user, { type: 'account', title: 'Password changed', message: 'If this was not you, reset your password immediately.', link: '/dashboard/settings' });
    // Older sessions are now revoked; hand this device a fresh token so it stays signed in
    res.json({ message: 'Password updated', token: signToken(user) });
  })
);

router.delete(
  '/',
  asyncHandler(async (req, res) => {
    const password = str(req.body?.password);
    if (isDemo(req.user)) throw new HttpError(403, 'The demo account cannot be deleted. Sign up to get your own workspace.');
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(password))) throw new HttpError(400, 'Password is incorrect.', { password: 'Password is incorrect' });
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
