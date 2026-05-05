import expressRateLimit from 'express-rate-limit';
import { RequestHandler, Request, Response, NextFunction } from 'express';
import config from '../config';
import { setCache, getCache } from './cache';

// If CACHE_DRIVER is 'redis' we'll use our simple cache-based limiter, otherwise
// fall back to express-rate-limit in-memory limiter.

const defaultOptions = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 55,
  message: { status: 0, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
};

function createLimiter(options: { keyPrefix?: string; max?: number; windowSeconds?: number } = {}): RequestHandler {
  const { keyPrefix = 'rl', max = 55, windowSeconds = 5 * 60 } = options;
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = (req.ip as string) || (req.headers['x-forwarded-for'] as string) || 'unknown';
      const key = `${keyPrefix}:${ip}`;
      const cur = await getCache(key);
      const attempts = parseInt(cur || '0', 10) + 1;
      await setCache(key, String(attempts), windowSeconds);

      if (attempts > max) {
        return res.status(429).json({ status: 0, message: 'Too many attempts, please try again later' });
      }

      return next();
    } catch (err) {
      // If cache is unavailable, allow the request to proceed but log the error
      // eslint-disable-next-line no-console
      console.error('Rate limiter error:', err);
      return next();
    }
  };
}

// Exported limiter factories
let authLimiter: RequestHandler;
let forgotPwdLimiter: RequestHandler;
let generalLimiter: RequestHandler;

if (config.CACHE_DRIVER && config.CACHE_DRIVER.toLowerCase() === 'redis') {
  // Use cache-backed limiter
  authLimiter = createLimiter({ keyPrefix: 'auth', max: 5, windowSeconds: 5 * 60 });
  forgotPwdLimiter = createLimiter({ keyPrefix: 'forgot_pwd', max: 5, windowSeconds: 5 * 60 });
  generalLimiter = createLimiter({ keyPrefix: 'general', max: 100, windowSeconds: 15 * 60 });
} else {
  // Fallback to express-rate-limit
  authLimiter = expressRateLimit({ ...defaultOptions });
  forgotPwdLimiter = expressRateLimit({ ...defaultOptions });
  generalLimiter = expressRateLimit({ windowMs: 100 * 60 * 1000, max: 100, message: { status: 0, message: 'Too many requests, please try again later' }, standardHeaders: true, legacyHeaders: false });
}


export { authLimiter, forgotPwdLimiter, generalLimiter };

/**
 * Programmatic rate limit check used by services.
 * Returns an object { status: boolean, message?: string }
 */
export async function rateLimit(req: Request, key: string, max = 5, windowSeconds = 300): Promise<{ status: boolean; message?: string }> {
  try {
    const ip = (req.ip as string) || (req.headers['x-forwarded-for'] as string) || 'unknown';
    const cacheKey = `${key}:${ip}`;
    const cur = await getCache(cacheKey);
    const attempts = parseInt(cur || '0', 10) + 1;
    await setCache(cacheKey, String(attempts), windowSeconds);

    if (attempts > max) {
      return { status: false, message: 'Too many attempts' };
    }

    return { status: true };
  } catch (err) {
    // If cache not available, allow action but log
    // eslint-disable-next-line no-console
    console.error('rateLimit helper error:', err);
    return { status: true };
  }
}

