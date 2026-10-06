import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './config.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);

app.use(
  helmet({
    // Everything the client loads is self-hosted, so the policy can be strict
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // toasts and animation libraries set inline styles
        imgSrc: ["'self'", 'data:', 'blob:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        workerSrc: ["'self'", 'blob:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// Same-origin by default. CORS is only enabled for the origins listed in CLIENT_ORIGIN.
if (config.clientOrigins.length) {
  app.use('/api', cors({ origin: config.clientOrigins.includes('*') ? '*' : config.clientOrigins, maxAge: 600 }));
}

app.use(compression());
app.use(express.json({ limit: '2mb' }));
// Log API traffic only (static assets would drown out useful lines)
app.use('/api', morgan(config.isProd ? 'combined' : 'dev', { skip: (req) => req.path === '/health' }));

app.get('/api/health', (req, res) => {
  const db = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(db === 'connected' ? 200 : 503).json({ status: db === 'connected' ? 'ok' : 'degraded', db });
});

// Broad per-IP limit for the whole API; auth routes add stricter limits of their own
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 1500,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many requests. Please slow down and try again shortly.' },
  })
);

// Fail fast with a clear message while the database is unreachable
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  res.status(503).json({ message: 'The service is temporarily unavailable. Please try again in a moment.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', notFound);

// Serve the built React app (single deployment for API + client)
if (config.serveClient) {
  // Hashed assets can be cached for a year; index.html must always be revalidated
  app.use('/assets', express.static(path.join(config.clientDist, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }));
  app.use(express.static(config.clientDist, { index: false, maxAge: '1h' }));
  app.get(/^\/(?!api(\/|$)).*/, (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(config.clientDist, 'index.html'));
  });
}

app.use(errorHandler);
