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
    contentSecurityPolicy: false, // SPA serves its own assets; tighten per deployment if needed
    crossOriginEmbedderPolicy: false,
    frameguard: false,
  })
);
app.use(cors({ origin: config.clientOrigin === '*' ? true : config.clientOrigin.split(','), credentials: true }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
if (!config.isProd) app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', time: new Date().toISOString() });
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

connectDB()
  .then(() => {
    app.listen(config.port, config.host, () => {
      console.log(`[novara] API listening on http://${config.host}:${config.port}`);
    });
  })
  .catch((err) => {
    console.error('[novara] Could not connect to MongoDB. Check MONGODB_URI.', err.message);
    process.exit(1);
  });
