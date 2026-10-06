import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  host: process.env.HOST || '0.0.0.0',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/novara',
  jwtSecret: process.env.JWT_SECRET || 'novara-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  serveClient: process.env.SERVE_CLIENT === 'true' || isProd,
};

if (isProd && config.jwtSecret === 'novara-dev-secret-change-me') {
  console.warn('[novara] JWT_SECRET is not set. Set a strong secret in production.');
}
