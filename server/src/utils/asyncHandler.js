export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const toNumber = (v, fallback = 0) => {
  const n = typeof v === 'string' ? Number(v.replace(/,/g, '')) : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

export const escapeRegex = (s = '') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Request body value as a string (anything else becomes ''), so `.trim()` can never throw. */
export const str = (v) => (typeof v === 'string' ? v : '');

/** Query value as a string. Repeated params (?a=1&a=2) arrive as arrays, take the first. */
export const qstr = (v) => (Array.isArray(v) ? str(v[0]) : str(v));

export const isDataImage = (s) => typeof s === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/.test(s);
