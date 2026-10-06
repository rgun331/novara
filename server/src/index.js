import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoose from 'mongoose';
import { config } from './config.js';
import { connectDB } from './db.js';
import { errorHandler, notFound } from './middleware/error.js';
import { seedDemo, DEMO } from './seed.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);
app.use(
  helmet({
    // Strict CSP when Express serves the built app (everything is self-hosted). Off for the API-only dev server.
    contentSecurityPolicy: config.serveClient
      ? {
          useDefaults: false,
          directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // toasts and animation libraries inject style tags
            imgSrc: ["'self'", 'data:', 'blob:'],
            fontSrc: ["'self'", 'data:'],
            connectSrc: ["'self'"],
            workerSrc: ["'self'", 'blob:'],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
          },
        }
      : false,
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  })
);
app.use(cors({ origin: config.clientOrigin === '*' ? true : config.clientOrigin.split(','), credentials: true }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
if (!config.isProd) app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    demo: config.seedDemo ? { email: DEMO.email, password: DEMO.password } : null,
    time: new Date().toISOString(),
  });
});

// While the database is (re)connecting, answer clearly instead of hanging on buffered queries
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  res.status(503).json({ message: 'The database is starting up. Please try again in a few seconds.' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', notFound);

// Serve the built React client (single-port deployments)
const clientDist = path.resolve(__dirname, '../../client/dist');
if (config.serveClient && fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '7d', index: false }));
  app.get(/^\/(?!api(\/|$)).*/, (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(errorHandler);

async function ensureDemo() {
  if (!config.seedDemo) return;
  try {
    const r = await seedDemo();
    console.log(`[novara] Demo account ${r.created ? 'created' : 'ready'}: ${DEMO.email} / ${DEMO.password}`);
  } catch (err) {
    console.error('[novara] Demo seed failed:', err.message);
  }
}

// Listen right away so the UI can show a helpful status while the database connects
app.listen(config.port, config.host, () => {
  console.log(`[novara] API listening on http://${config.host}:${config.port}`);
});

// If the database comes back after a restart (e.g. an in-memory dev DB was wiped), re-seed the demo
mongoose.connection.on('reconnected', ensureDemo);

connectDB(config.isProd ? 10 : Infinity)
  .then(ensureDemo)
  .catch((err) => {
    console.error('[novara] Could not start the database connection:', err.message);
    process.exit(1);
  });
