import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env, isProd } from './config/env.js';
import { logger } from './config/logger.js';
import { router } from './routes/index.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../frontend/dist');

export function createApp() {
  const app = express();

  // Trust the first proxy hop (needed for correct req.ip / rate limiting
  // and secure cookies when deployed behind a load balancer per the SDD's
  // Edge Tier).
  app.set('trust proxy', 1);

  // NFR-SE1: in production, a TLS-terminating reverse proxy sits in front of
  // this process; here we just enforce that traffic claiming to be plain
  // HTTP is redirected, and set HSTS so browsers remember to use HTTPS.
  if (isProd) {
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] === 'http') {
        return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
      }
      next();
    });
  }

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
          connectSrc: ["'self'", 'https:', 'http:'],
          objectSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: isProd,
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (same-origin, curl, mobile apps) or any valid incoming origin
        return callback(null, true);
      },
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(
    morgan(isProd ? 'combined' : 'dev', {
      stream: { write: (msg) => logger.info(msg.trim()) },
      skip: (req) => req.path === '/health',
    }),
  );

  // NFR-P2: baseline protection for every route; the analysis endpoint has
  // its own, tighter concurrency queue on top of this.
  app.use(apiRateLimiter);

  app.use('/', router);

  // Serve user-uploaded public assets (e.g. avatars)
  const uploadsPath = path.resolve(process.cwd(), env.UPLOAD_DIR);
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));

  // Serve the React frontend production build if present
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      // /auth/callback is the frontend OAuth return route — serve index.html
      if (req.path === '/auth/callback') {
        return res.sendFile(path.join(distPath, 'index.html'));
      }
      if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path === '/health') {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
