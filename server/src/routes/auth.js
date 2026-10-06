import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { optionalAuth, protect } from '../middleware/auth.js';
import { endSession, startSession } from '../utils/session.js';
import { asyncHandler, HttpError, str } from '../utils/asyncHandler.js';
import { EMAIL_RE, passwordError } from '../utils/validation.js';
import { notify } from '../utils/notify.js';

const router = Router();

const limiterDefaults = { standardHeaders: 'draft-7', legacyHeaders: false };

// New accounts per IP
const signupLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: { message: 'Too many sign-ups from this network. Please try again later.' },
});

// Login attempts per IP (all accounts)
const loginIpLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 15 * 60 * 1000,
  limit: 60,
  message: { message: 'Too many login attempts. Please wait a few minutes and try again.' },
});

// Failed logins per account + IP, so one account cannot be brute-forced
const loginAccountLimiter = rateLimit({
  ...limiterDefaults,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip)}:${str(req.body?.email).trim().toLowerCase()}`,
  message: { message: 'Too many failed attempts for this account. Please wait 15 minutes and try again.' },
});

// Compared against when the email is unknown so both paths take the same time (no account probing by timing)
const DUMMY_HASH = bcrypt.hashSync('novara-timing-equalizer', 11);

function skuPrefixFrom(businessName = '') {
  const words = businessName.replace(/[^a-z0-9\s]/gi, ' ').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'NV';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
}

router.post(
  '/signup',
  signupLimiter,
  asyncHandler(async (req, res) => {
    const b = req.body || {};
    const name = str(b.name).trim();
    const email = str(b.email).trim().toLowerCase();
    const password = str(b.password);
    const businessName = str(b.businessName).trim();

    const errors = {};
    if (name.length < 2) errors.name = 'Enter your full name';
    if (!EMAIL_RE.test(email)) errors.email = 'Enter a valid email address';
    const pwErr = passwordError(password);
    if (pwErr) errors.password = pwErr;
    if (Object.keys(errors).length) throw new HttpError(400, 'Please check the highlighted fields.', errors);

    const emailTaken = new HttpError(409, 'An account with this email already exists.', { email: 'This email is already registered' });
    if (await User.exists({ email })) throw emailTaken;

    let user;
    try {
      user = await User.create({
        name,
        email,
        password,
        businessName,
        preferences: { skuPrefix: skuPrefixFrom(businessName) },
        lastLoginAt: new Date(),
      });
    } catch (err) {
      if (err.code === 11000) throw emailTaken; // two sign-ups raced for the same email
      throw err;
    }

    await notify(user, {
      type: 'system',
      title: `Welcome to Novara, ${user.name.split(' ')[0]}`,
      message: 'Start by adding your first product. SKUs are generated for you automatically.',
      link: '/dashboard/products',
    });

    startSession(res, user, { remember: true });
    res.status(201).json({ user: user.toSafeJSON() });
  })
);

router.post(
  '/login',
  loginIpLimiter,
  loginAccountLimiter,
  asyncHandler(async (req, res) => {
    const email = str(req.body?.email).trim().toLowerCase();
    const password = str(req.body?.password);
    if (!email || !password) throw new HttpError(400, 'Enter your email and password.');

    const user = await User.findOne({ email }).select('+password +tokenVersion');
    const valid = user ? await user.comparePassword(password) : await bcrypt.compare(password, DUMMY_HASH).then(() => false);
    if (!valid) throw new HttpError(401, 'That email and password combination is not right.');

    user.lastLoginAt = new Date();
    await user.save();
    startSession(res, user, { remember: req.body?.remember !== false });
    res.json({ user: user.toSafeJSON() });
  })
);

// Who is signed in? Always 200 so the app can check on load without logging errors for guests.
router.get('/session', optionalAuth, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ user: req.user ? req.user.toSafeJSON() : null });
});

router.get('/me', protect, (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ user: req.user.toSafeJSON() });
});

router.post('/logout', (req, res) => {
  endSession(res);
  res.json({ message: 'Signed out' });
});

// Revokes every session for this account, on all devices
router.post(
  '/logout-all',
  protect,
  asyncHandler(async (req, res) => {
    await User.updateOne({ _id: req.user._id }, { $inc: { tokenVersion: 1 } });
    endSession(res);
    res.json({ message: 'Signed out on all devices' });
  })
);

export default router;
