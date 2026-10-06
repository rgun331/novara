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

export const isDataImage = (s) => typeof s === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/.test(s);
