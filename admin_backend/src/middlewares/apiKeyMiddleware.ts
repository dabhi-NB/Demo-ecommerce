import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'] as string | undefined;
    if (!apiKey || apiKey !== process.env.API_KEY) {
        logger.warn(`Unauthorized access attempt to ${req.originalUrl} from ${req.ip}`);
        return res.status(401).json({ message: 'Invalid or missing api-key' });
    }
    next();
}
