import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import config from './config';
import errorHandler from './middlewares/errorHandler';
import path from 'path';
import fs from 'fs';
const routes: any = require('./routes/web').default;

const app = express();

// Trust proxy
app.set('trust proxy', 1);

// CREATE UPLOAD DIR
const uploadDir = path.join(process.cwd(), 'upload/profile');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ SERVE STATIC FILES FIRST (BEFORE HELMET!)
app.use('/upload', cors({
  origin: '*',
  methods: ['GET', 'HEAD'],
}), express.static(path.join(process.cwd(), 'upload')));

// ✅ Serve product images without auth (before helmet/apiKey middleware)
app.use('/upload/products', cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
}), express.static(path.join(process.cwd(), 'upload/products'), {
  index: false,
  setHeaders: (res: express.Response, path: string) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
}));

// Security middleware (AFTER /upload routes)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http:", "https:", "*"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

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
// Mount routes
app.use('/', routes);

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    status: 0,
    message: `Route ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /health - Health check',
      'POST /api/public/auth/login - User login',
      'GET /api/user/profile - Get user profile',
      'PUT /api/account/update - Update account',
      'POST /api/forgot-password/send-otp - Send OTP',
    ]
  });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;