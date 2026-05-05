import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import Auth from '../models/authModel';
import User from '../models/adminModel';
import { getCache, setCache } from '../utils/cache';

export interface AuthRequest extends Request {
  userData?: any;
  authData?: any;
}

export async function userAuthMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authToken = req.headers['x-auth-token'] as string | undefined;
    if (!authToken) {
      logger.warn(`Missing auth-token for ${req.originalUrl} from ${req.ip}`);
      return res.status(401).json({ status: 0, message: 'Missing auth-token' });
    }

    const authKey = `auth:token:${authToken}`;
    let authData: any = await getCache(authKey);

    if (!authData) {
      // Load from DB if not in cache
      const dbAuth = await Auth.findOne({ auth_token: authToken }).lean();
      if (!dbAuth) {
        logger.warn(`Invalid auth-token for ${req.originalUrl} from ${req.ip}`);
        return res.status(401).json({ status: 0, message: 'Invalid auth-token' });
      }

      authData = dbAuth;

      // Cache with TTL based on token expiry
      try {
        const expireAt = new Date(authData.auth_token_expire_at).getTime();
        const now = Date.now();
        const ttl = Math.max(1, Math.floor((expireAt - now) / 1000));
        if (ttl > 0) await setCache(authKey, authData, ttl);
      } catch {
        // ignore cache errors
      }
    }

    // Check token expiration
    if (new Date() > new Date(authData.auth_token_expire_at)) {
      logger.warn(`Expired auth-token for ${req.originalUrl} from ${req.ip}`);
      return res.status(401).json({ status: 0, message: 'Token expired' });
    }

    // Fetch user
    const userKey = `user:${authData.user_id}`;
    let userData: any = await getCache(userKey);

    if (!userData) {
      const dbUser = await User.findById(authData.user_id).lean();
      if (!dbUser) {
        logger.warn(`User not found for token ${authToken.substring(0, 10)}... from ${req.ip}`);
        return res.status(401).json({ status: 0, message: 'User not found' });
      }
      userData = dbUser;

      // Cache user for 5 minutes
      try { await setCache(userKey, userData, 300); } catch { }
    }

    // Check if user is active
    if (userData.status != 1) {
      logger.warn(`Suspended user ${userData._id} attempted access to ${req.originalUrl} from ${req.ip}`);
      return res.status(403).json({ status: 0, message: 'Account suspended' });
    }

    // Attach to req for downstream controllers
    req.userData = userData;
    req.authData = authData;

    next();
  } catch (error: any) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ status: 0, message: 'Internal server error' });
  }
}
