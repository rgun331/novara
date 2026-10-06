import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import { protect, signToken } from '../middleware/auth.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { notify } from '../utils/notify.js';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function skuPrefixFrom(businessName = '') {
  const words = businessName.replace(/[^a-z0-9\s]/gi, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'NV';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
}

router.post(
  '/signup',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { name = '', email = '', password = '', businessName = '' } = req.body || {};
    const errors = {};
    if (name.trim().length < 2) errors.name = 'Enter your full name';
    if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
    if (password.length < 8) errors.password = 'Use at least 8 characters';
    else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errors.password = 'Mix letters and numbers';
    if (Object.keys(errors).length) throw new HttpError(400, 'Please check the highlighted fields.', errors);

    const exists = await User.exists({ email: email.trim().toLowerCase() });
    if (exists) throw new HttpError(409, 'An account with this email already exists.', { email: 'This email is already registered' });

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      businessName: businessName.trim(),
      preferences: { skuPrefix: skuPrefixFrom(businessName) },
      lastLoginAt: new Date(),
    });

    await notify(user, {
      type: 'system',
      title: `Welcome to Novara, ${user.name.split(' ')[0]}`,
      message: 'Start by adding your first product. SKUs are generated for you automatically.',
      link: '/dashboard/products',
    });

    res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
  })
);

router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req, res) => {
    const { email = '', password = '' } = req.body || {};
    if (!email || !password) throw new HttpError(400, 'Enter your email and password.');

    const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new HttpError(401, 'That email and password combination is not right.');
    }

    user.lastLoginAt = new Date();
    await user.save();
    res.json({ token: signToken(user), user: user.toSafeJSON() });
  })
);

router.get('/me', protect, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

export default router;
