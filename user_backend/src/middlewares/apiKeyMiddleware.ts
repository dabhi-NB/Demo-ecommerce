import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const publicPaths = ["/health", "/page/", "/contact"];
  if (publicPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  if (!process.env.API_KEY) {
    logger.info(`API_KEY not set, skipping validation for ${req.path}`);
    return next();
  }

  const apiKey = req.headers["x-api-key"] as string | undefined;
  // logger.info(
  //   `API Key check: received="${apiKey}", expected="${process.env.API_KEY}"`
  // );

  if (!apiKey || apiKey !== process.env.API_KEY) {
    logger.warn(
      `Unauthorized access attempt to ${req.originalUrl} from ${req.ip}`
    );
    res.status(403).json({
      status: 0,
      message: "Invalid or missing api-key",
      data: [],
    });
    return;
  }
  next();
}
