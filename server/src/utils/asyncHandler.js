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
export const qstr = (v) => (Array.isArray(v) ? str(v[0]) : str(v)).slice(0, 200);

export const isDataImage = (s) => typeof s === 'string' && /^data:image\/(png|jpe?g|webp|gif);base64,/.test(s);

const IMAGE_TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };

/** Sends a stored data-URL image as binary. Responses are private (per user) and cached for a year, since URLs are versioned. */
export function sendDataImage(res, dataUrl) {
  const m = /^data:image\/(png|jpe?g|webp|gif);base64,(.+)$/s.exec(dataUrl || '');
  if (!m) throw new HttpError(404, 'Image not found');
  res.set({
    'Content-Type': IMAGE_TYPES[m[1]],
    'Cache-Control': 'private, max-age=31536000, immutable',
    'Content-Disposition': 'inline',
  });
  res.send(Buffer.from(m[2], 'base64'));
}
