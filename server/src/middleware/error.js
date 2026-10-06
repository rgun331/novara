import { config } from '../config.js';

export function notFound(req, res) {
  res.status(404).json({ message: 'Not found' });
}

const DB_UNAVAILABLE = /^(MongoNetworkError|MongoServerSelectionError|MongoNotConnectedError|MongoTopologyClosedError|MongooseServerSelectionError)$/;

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = Number.isInteger(err.status) ? err.status : 500;
  let message = err.message;
  let details = err.details;

  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Please check the highlighted fields.';
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
    details = undefined;
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with this value already exists.';
    details = undefined;
  } else if (DB_UNAVAILABLE.test(err.name || '')) {
    status = 503;
    message = 'The service is temporarily unavailable. Please try again in a moment.';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'The request body is not valid JSON.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Upload is too large. Please use an image under 1.5 MB.';
  }

  if (status >= 500) {
    console.error(`[novara] ${req.method} ${req.originalUrl} failed:`, err);
    // Never leak internal error details to clients in production
    if (config.isProd && status === 500) message = 'Something went wrong. Please try again.';
  }

  res.status(status).json({ message: message || 'Something went wrong. Please try again.', ...(details ? { details } : {}) });
}
