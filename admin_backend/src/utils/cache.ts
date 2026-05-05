import redisClient from "../lib/redis";
import config from "../config";
import NodeCache from "node-cache";

const useRedis = !!(config.CACHE_DRIVER && config.CACHE_DRIVER.toLowerCase() === "redis");
const nodeCache = new NodeCache({ stdTTL: 0, checkperiod: 60 });

/**
 * Set a value in cache. Converts any object to JSON string automatically.
 * ttlSeconds: TTL in seconds
 */
export async function setCache(key: string, value: any, ttlSeconds = 60): Promise<boolean> {
  let str: string;

  try {
    // Always stringify value
    str = typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    // fallback to string "[object Object]" if stringify fails
    str = String(value);
  }

  if (useRedis) {
    try {
      if (redisClient && (redisClient as any).isOpen) {
        await redisClient.set(key, str);
        try {
          await (redisClient as any).expire(key, ttlSeconds);
        } catch {
          // ignore
        }
        return true;
      }
    } catch {
      // fallback to memory cache
    }
  }

  nodeCache.set(key, str, ttlSeconds);
  return true;
}

/**
 * Get a cached value. Tries to parse JSON, but returns raw string on failure.
 */
export async function getCache(key: string): Promise<any | null> {
  let val: string | null = null;

  if (useRedis) {
    try {
      if (redisClient && (redisClient as any).isOpen) {
        val = await redisClient.get(key);
      }
    } catch {
      // fallback
    }
  }

  if (!val) {
    val = nodeCache.get<string>(key) ?? null;
  }

  if (!val) return null;

  try {
    // Try parse as JSON
    return JSON.parse(val);
  } catch {
    // Return as string if parsing fails
    return val;
  }
}

/**
 * Delete a cache key
 */
export async function delCache(key: string): Promise<boolean> {
  if (useRedis) {
    try {
      if (redisClient && (redisClient as any).isOpen) {
        await redisClient.del(key);
        return true;
      }
    } catch {}
  }

  nodeCache.del(key);
  return true;
}

/**
 * Clear all cache
 */
export async function clearAllCache(): Promise<boolean> {
  if (useRedis) {
    try {
      if (redisClient && (redisClient as any).isOpen) {
        await (redisClient as any).flushDb();
        return true;
      }
    } catch {}
  }

  nodeCache.flushAll();
  return true;
}
