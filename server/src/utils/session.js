import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// The session lives in an httpOnly cookie so page scripts can never read the token.
// The "__Host-" prefix (HTTPS only) also pins it to this exact host and path "/".
export const COOKIE_NAME = config.cookieSecure ? '__Host-novara_session' : 'novara_session';

const DURATION_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
function durationMs(value) {
  const m = /^(\d+)\s*([smhd])$/.exec(String(value).trim());
  return m ? Number(m[1]) * DURATION_MS[m[2]] : 7 * DURATION_MS.d;
}

const baseCookie = () => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: config.cookieSameSite,
  path: '/',
});

function signToken(user, { remember = true } = {}) {
  return jwt.sign({ sub: String(user._id), v: user.tokenVersion || 0, r: remember ? 1 : 0 }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  });
}

/** Issues a fresh session cookie. Without "remember", the cookie ends when the browser closes. */
export function startSession(res, user, { remember = true } = {}) {
  const options = baseCookie();
  if (remember) options.maxAge = durationMs(config.jwtExpiresIn);
  res.cookie(COOKIE_NAME, signToken(user, { remember }), options);
}

export function endSession(res) {
  res.clearCookie(COOKIE_NAME, baseCookie());
}

export function readSessionToken(req) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq > -1 && part.slice(0, eq).trim() === COOKIE_NAME) {
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF protection for cookie sessions: state-changing requests must carry a custom header.
 * Browsers only let a cross-site page add custom headers after a CORS preflight, which
 * this API only grants to origins listed in CLIENT_ORIGIN. HTML forms cannot add headers at all.
 */
export function requireCsrfHeader(req, res, next) {
  if (SAFE_METHODS.has(req.method) || req.get('x-requested-with') === 'XMLHttpRequest') return next();
  res.status(403).json({ message: 'Request blocked. Please reload the page and try again.' });
}
