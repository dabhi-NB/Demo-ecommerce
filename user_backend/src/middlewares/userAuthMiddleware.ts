import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import Auth from "../models/authModel";
import User from "../models/userModel";
import { getCache, setCache } from "../utils/cache";

declare module "express-serve-static-core" {
  interface Request {
    user_id: string;
    user_role: number;
    authData: any;
    userData: any;
  }
}

export async function userAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // ✅ Accept x-auth-token, auth-token (fallback), or Authorization header
    let authToken = req.headers["x-auth-token"] as string | undefined;

    // ✅ Fallback to auth-token if x-auth-token not found (backward compatibility)
    if (!authToken) {
      authToken = req.headers["auth-token"] as string | undefined;
    }

    // ✅ Support Authorization: Bearer token
    if (!authToken && req.headers["authorization"]) {
      const authHeader = req.headers["authorization"] as string;
      if (authHeader.startsWith("Bearer ")) {
        authToken = authHeader.split(" ")[1];
      }
    }

    // Debug logging for auth headers
    console.log(`[AUTH DEBUG] ${req.method} ${req.originalUrl}`);
    console.log(
      `[AUTH DEBUG] x-auth-token:`,
      req.headers["x-auth-token"] ? "present" : "missing"
    );
    console.log(
      `[AUTH DEBUG] auth-token:`,
      req.headers["auth-token"] ? "present" : "missing"
    );
    console.log(
      `[AUTH DEBUG] authorization:`,
      req.headers["authorization"] ? "present" : "missing"
    );

    if (!authToken) {
      logger.warn(
        `Missing authentication token for ${req.originalUrl} from ${
          req.ip
        }. Headers received: ${JSON.stringify(req.headers)}`
      );
      return res
        .status(401)
        .json({ status: 0, message: "Missing authentication token" });
    }

    console.log(
      `[AUTH DEBUG] Using auth token: ${authToken.substring(0, 10)}...`
    );

    const authKey = `auth:token:${authToken}`;
    let authData: any = null;

    // Try cache first
    const cached = await getCache(authKey);
    if (cached) {
      try {
        authData = JSON.parse(cached);
      } catch {
        authData = null;
      }
    }

    // If not in cache, load from DB and cache it
    if (!authData) {
      const dbAuth = await Auth.findOne({ auth_token: authToken }).lean();
      if (!dbAuth) {
        logger.warn(`Invalid auth-token for ${req.originalUrl} from ${req.ip}`);
        return res
          .status(401)
          .json({ status: 0, message: "Invalid auth-token" });
      }
      authData = dbAuth;

      try {
        const expireAt = new Date(authData.auth_token_expire_at).getTime();
        const now = Date.now();
        const ttl = Math.max(1, Math.floor((expireAt - now) / 1000));
        if (ttl > 0) await setCache(authKey, authData, ttl);
      } catch {
        //   cache errors
      }
    } 

    // Check token expiry
    if (new Date() > new Date(authData.auth_token_expire_at)) {
      logger.warn(`Expired auth-token for ${req.originalUrl} from ${req.ip}`);
      return res.status(401).json({ status: 0, message: "Token expired" });
    }

    // Extend session if remaining time < 60 minutes
    const now = Date.now();
    const expireAt = new Date(authData.auth_token_expire_at).getTime();
    const remainingMs = expireAt - now;
    if (remainingMs < 60 * 60 * 1000) {
      // less than 60 minutes
      const newExpireAt = new Date(
        authData.auth_token_expire_at.getTime() + 120 * 60 * 1000
      );
      await Auth.updateOne(
        { _id: authData._id },
        { auth_token_expire_at: newExpireAt, updated_at: new Date() }
      );
      authData.auth_token_expire_at = newExpireAt;
      // Update cache with new TTL
      const ttl = Math.floor((newExpireAt.getTime() - now) / 1000);
      if (ttl > 0) await setCache(authKey, authData, ttl);
    }

    // ✅ Fetch user data with cache
    const userKey = `user:${authData.user_id}`;
    let userData: any = null;
    const cachedUser = await getCache(userKey);
    if (cachedUser) {
      try {
        userData = JSON.parse(cachedUser);
      } catch {
        userData = null;
      }
    }

    if (!userData) {
      const dbUser = await User.findById(authData.user_id).lean();
      if (!dbUser) {
        logger.warn(
          `User not found for token ${authToken.substring(0, 10)}... from ${
            req.ip
          }`
        );
        return res.status(401).json({ status: 0, message: "User not found" });
      }
      userData = dbUser;
      try {
        await setCache(userKey, userData, 300); // cache 5 min
      } catch {}
    }

    // Check if user is active (handle both string and number values)
    if (userData.status !== "1" && userData.status !== 1) {
      logger.warn(
        `Suspended user ${userData._id} attempted access to ${req.originalUrl} from ${req.ip}`
      );
      return res.status(403).json({ status: 0, message: "Account suspended" });
    }

    // ✅ Attach auth and user info to request
    req.user_id = authData.user_id;
    req.user_role = userData.role;
    req.authData = authData;
    req.userData = userData;

    next();
  } catch (error) {
    logger.error("Error in userAuthMiddleware:", error);
    return res
      .status(500)
      .json({ status: 0, message: "Internal server error" });
  }
}
