import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import errorHandler from './middlewares/errorHandler';
const routes = require('./routes/web').default;
import path from 'path';

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use('/upload', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
});

app.use(compression());
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Logging
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
// app.use('/uploads', express.static('upload'));

//Logo
app.use('/upload', express.static(path.join(__dirname, '..', 'upload')));

// Serve sitemap and other public files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Mount routes
app.use('/', routes);

// 404 handler — register as middleware without a path to avoid passing '*' to path-to-regexp
app.use(((req: Request, res: Response) => {
  res.status(404).json({
    status: 0,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET / - Home',
      'GET /health - Health check',
      'POST /auth/login - User login',
      'POST /auth/otp-send - Send OTP',
      'POST /auth/otp-verify - Verify OTP',
      'PUT /auth/update-profile - Update profile',
      'POST /auth/logout - Logout',
      'POST /auth/refresh-token - Refresh token',
      'GET /account/profile - Get profile',
      'PUT /account/update - Update account',
      'PUT /account/profile - Update profile',
      'POST /account/register - Register',
      'POST /forgot-password/send-otp - Send OTP for password reset',
      'POST /forgot-password/verify-otp - Verify OTP for password reset',
      'POST /forgot-password/reset-password - Reset password',
    ]
  });
}) as unknown as express.RequestHandler);

// Error handler (must be last)
app.use(errorHandler as express.ErrorRequestHandler);

export default app;

