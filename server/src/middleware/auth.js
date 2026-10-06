import User from '../models/User.js';
import { asyncHandler, HttpError } from '../utils/asyncHandler.js';
import { readSessionToken, verifyToken } from '../utils/session.js';

/** Resolves the user for the current session cookie, or null when there is no valid session. */
async function sessionUser(req) {
  const token = readSessionToken(req);
  if (!token) return { user: null, reason: 'Please log in to continue.' };

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return { user: null, reason: 'Your session has expired. Please log in again.' };
  }

  const user = await User.findById(payload.sub).select('+tokenVersion');
  if (!user) return { user: null, reason: 'Account not found. Please log in again.' };
  // tokenVersion changes on password change or "sign out everywhere", revoking older sessions
  if ((payload.v || 0) !== (user.tokenVersion || 0)) return { user: null, reason: 'You were signed out. Please log in again.' };

  return { user, remember: payload.r !== 0 };
}

export const protect = asyncHandler(async (req, res, next) => {
  const { user, reason, remember } = await sessionUser(req);
  if (!user) throw new HttpError(401, reason);
  req.user = user;
  req.sessionRemember = remember;
  next();
});

/** Like protect, but lets anonymous requests through with req.user = null. */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const { user, remember } = await sessionUser(req);
  req.user = user;
  req.sessionRemember = remember;
  next();
});
