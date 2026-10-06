import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const env = process.env;
const isProd = env.NODE_ENV === 'production';
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

function fail(message) {
  console.error(`[novara] Configuration error: ${message}`);
  process.exit(1);
}

// Required settings: fail fast with a clear message instead of starting half-configured
const mongoUri = (env.MONGO_URI || '').trim();
if (!mongoUri) fail('MONGO_URI is not set. Add your MongoDB Atlas connection string to server/.env');
if (!/^mongodb(\+srv)?:\/\//.test(mongoUri)) fail('MONGO_URI must start with mongodb+srv:// or mongodb://');

const jwtSecret = env.JWT_SECRET || '';
if (jwtSecret.length < 32 || /replace-with|change-?me|your[-_]?secret/i.test(jwtSecret)) {
  fail(
    'JWT_SECRET must be a random string of at least 32 characters (not a placeholder). Generate one with:\n' +
      '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
  );
}

const trustProxy = env.TRUST_PROXY ?? (isProd ? '1' : 'false');

const clientOrigins = (env.CLIENT_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);
if (clientOrigins.some((o) => !/^https?:\/\/[^/*]+$/.test(o))) {
  fail('CLIENT_ORIGIN must be a comma-separated list of exact origins like https://app.example.com (no wildcards or paths)');
}

// Session cookies are Secure (HTTPS only) in production. COOKIE_SECURE=false allows testing a production build over plain http.
const cookieSecure = env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : isProd;
// "strict" works for a single deployment and for app./api. subdomains of one domain.
// Use "none" only if the client and API are on unrelated domains (some browsers block that entirely).
const cookieSameSite = (env.COOKIE_SAMESITE || 'strict').toLowerCase();
if (!['strict', 'lax', 'none'].includes(cookieSameSite)) fail('COOKIE_SAMESITE must be strict, lax or none');
if (cookieSameSite === 'none' && !cookieSecure) fail('COOKIE_SAMESITE=none requires HTTPS (COOKIE_SECURE=true)');

export const config = Object.freeze({
  isProd,
  port: Number(env.PORT) || 5000,
  host: env.HOST || '0.0.0.0',
  mongoUri,
  jwtSecret,
  jwtExpiresIn: env.JWT_EXPIRES_IN || '7d',
  // Only needed when the client is hosted on a different domain (comma-separated origins)
  clientOrigins,
  cookieSecure,
  cookieSameSite,
  // Number of reverse proxies in front of the app (e.g. 1 on Render/Railway/Heroku); used for client IPs in rate limits
  trustProxy: /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy === 'true',
  clientDist,
  // Serve the built React app from Express when it exists (set SERVE_CLIENT=false to run API-only)
  serveClient: env.SERVE_CLIENT ? env.SERVE_CLIENT === 'true' : fs.existsSync(path.join(clientDist, 'index.html')),
});
