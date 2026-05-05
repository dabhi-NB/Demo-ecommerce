import { Request, Response, NextFunction, RequestHandler } from 'express';
import redisClient from '../lib/redis';

type LimiterOptions = {
    keyPrefix?: string;
    max?: number;
    windowSeconds?: number;
};

function createRedisLimiter(options: LimiterOptions = {}): RequestHandler {
    const { keyPrefix = 'rl', max = 5, windowSeconds = 5 * 60 } = options;

    return async (req: any, res: Response, next: NextFunction) => {
        try {
            const ip = (req.ip as string) || (req.headers['x-forwarded-for'] as string) || 'unknown';
            const redisKey = `${keyPrefix}:${ip}`;

            // Increment and get current count
            const attempts = (await redisClient.incr(redisKey)) as number;

            // If this is the first attempt, set TTL
            if (attempts === 1) {
                await redisClient.expire(redisKey, windowSeconds);
            }

            if (attempts > max) {
                const ttl = await redisClient.ttl(redisKey);
                const remainingMinutes = ttl > 0 ? Math.ceil(ttl / 60) : Math.ceil(windowSeconds / 60);
                const message = { status: 0, message: `Too many attempts. Please try again in ${remainingMinutes} minutes.` };
                return res.status(429).json(message);
            }

            return next();
        } catch (err) {
            // If Redis is unavailable, allow the request to proceed but log the error to console
            // (Preserve availability over strict rate limiting)
            // eslint-disable-next-line no-console
            console.error('Redis rate limiter error:', err);
            return next();
        }
    };
}

export const authLimiter: RequestHandler = createRedisLimiter({ keyPrefix: 'auth', max: 5, windowSeconds: 5 * 60 });

export const forgotPwdLimiter: RequestHandler = createRedisLimiter({ keyPrefix: 'forgot_pwd', max: 5, windowSeconds: 5 * 60 });

// Backwards-compatible helper used across services: rateLimit(req, key, maxAttempts, windowSeconds)
export async function rateLimit(req: Request, key: string, maxAttempts: number = 5, windowSeconds: number = 900): Promise<{ status: number; message: string }> {
    try {
        const ip = (req.ip as string) || (req.headers['x-forwarded-for'] as string) || 'unknown';
        const redisKey = `rate_limit:${key}:${ip}`;

        const current = await redisClient.get(redisKey);
        const attempts = parseInt(current || '0', 10);

        if (attempts >= maxAttempts) {
            const ttl = await redisClient.ttl(redisKey);
            const remainingTime = ttl > 0 ? Math.ceil(ttl / 60) : Math.ceil(windowSeconds / 60);
            return { status: 0, message: `Too many attempts. Please try again in ${remainingTime} minutes.` };
        }

        // increment
        await redisClient.incr(redisKey);
        await redisClient.expire(redisKey, windowSeconds);

        return { status: 1, message: 'Allowed' };
    } catch (err) {
        // On error, allow request but log
        // eslint-disable-next-line no-console
        console.error('rateLimit helper error:', err);
        return { status: 1, message: 'Allowed (rate limit service unavailable)' };
    }
}