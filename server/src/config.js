import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  host: process.env.HOST || '0.0.0.0',
  // Leave MONGODB_URI empty in development to use the built-in dev database
  mongoUri: process.env.MONGODB_URI || '',
  embeddedDb: !process.env.MONGODB_URI && (process.env.EMBEDDED_DB ? process.env.EMBEDDED_DB === 'true' : !isProd),
  embeddedDbPort: Number(process.env.EMBEDDED_DB_PORT) || 27018,
  jwtSecret: process.env.JWT_SECRET || 'novara-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  serveClient: process.env.SERVE_CLIENT === 'true' || isProd,
  // Creates demo@novara.app / demo1234 with sample data on startup (off in production unless enabled)
  seedDemo: process.env.SEED_DEMO ? process.env.SEED_DEMO === 'true' : !isProd,
};

if (isProd && config.jwtSecret === 'novara-dev-secret-change-me') {
  console.warn('[novara] JWT_SECRET is not set. Set a strong secret in production.');
}
