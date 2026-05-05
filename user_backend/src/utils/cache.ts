import redisClient from "../lib/redis";
import config from "../config";
import NodeCache from "node-cache";

const useRedis = !!(config.CACHE_DRIVER && config.CACHE_DRIVER.toLowerCase() === "redis");
const nodeCache = new NodeCache({ stdTTL: 0, checkperiod: 60 });

/**
 * Set a stringifiable value in cache. `ttlSeconds` is TTL in seconds.
 */
export async function setCache(key: string, value: any, ttlSeconds = 60): Promise<boolean> {
  const str = typeof value === "string" ? value : JSON.stringify(value);
  if (useRedis) {
    try {
      if (redisClient && (redisClient as any).isOpen) {
        await redisClient.set(key, str);
        try {
          await (redisClient as any).expire(key, ttlSeconds);
        } catch {
          /* ignore */
        }
        return true;
      }
    } catch {
      // fall through to memory fallback
    }
  }

  nodeCache.set(key, str, ttlSeconds);
  return true;
}

/**
 * Get raw string value from cache or null if missing.
 */
export async function getCache(key: string): Promise<string | null> {
  if (useRedis) {
    try {
      if (redisClient && (redisClient as any).isOpen) {
        const v = await redisClient.get(key);
        return v ?? null;
      }
    } catch {
      // fallback
    }
  }

  const v = nodeCache.get<string>(key);
  return v ?? null;
}

/**
 * Delete a cache key.
 */
export async function delCache(key: string): Promise<boolean> {
  if (useRedis) {
    try {
      if (redisClient && (redisClient as any).isOpen) {
        await redisClient.del(key);
        return true;
      }
    } catch {
      // fallback
    }
  }

  nodeCache.del(key);
  return true;
}
