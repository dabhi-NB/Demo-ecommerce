import { createClient } from 'redis';
import config from '../config';

// If the app is configured to use the in-memory cache, avoid creating a real
// Redis client — this prevents connection/socket errors during local dev.
let redisClient: any;

if (config.CACHE_DRIVER && config.CACHE_DRIVER.toLowerCase() === 'memory') {
    // Minimal stub that matches the subset of the Redis client API used in the project.
    redisClient = {
        isOpen: false,
        connect: async () => {},
        get: async (_: string) => null,
        set: async (_: string, __: string) => 'OK',
        del: async (_: string) => 0,
        expire: async (_: string, __: number) => 1,
        ttl: async (_: string) => -2,
        on: (_: string, __: any) => {},
    };
} else {
    redisClient = createClient({ url: config.REDIS_URL });

    redisClient.on('error', (err: any) => console.error('Redis Client Error', err));

    (async () => {
        if (!redisClient.isOpen) {
            try {
                await redisClient.connect();
            } catch (err) {
                // Log and continue — don't crash the process if Redis is unavailable
                // eslint-disable-next-line no-console
                console.error('Redis initial connect failed (continuing without Redis):', err);
            }
        }
    })();
}

export default redisClient;
