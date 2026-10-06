export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong';
  let details = err.details;

  if (err.name === 'ValidationError') {
    status = 400;
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    message = 'Please check the highlighted fields.';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    message = 'A record with this value already exists.';
  } else if (/Mongo(Network|ServerSelection|NotConnected|Topology)|MongooseServerSelection/.test(err.name || '') || /ECONNREFUSED|ECONNRESET|connection .* closed/i.test(err.message || '')) {
    status = 503;
    message = 'The database is starting up. Please try again in a few seconds.';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Upload is too large. Please use an image under 1.5 MB.';
  }

  if (status === 503) console.error('[novara] Database unavailable:', err.message);
  else if (status >= 500) console.error('[novara]', err);
  res.status(status).json({ message, ...(details ? { details } : {}) });
}
