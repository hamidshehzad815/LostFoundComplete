import { getRedis, isRedisConnected } from "../config/redis.js";

const TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 900,
  VERY_LONG: 3600,
};

const getOrSet = async (key, fetchFn, ttl = TTL.MEDIUM) => {
  const redis = getRedis();
  if (!redis || !isRedisConnected()) {
    return fetchFn();
  }

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }

    const data = await fetchFn();
    redis.set(key, JSON.stringify(data), "EX", ttl).catch(() => {});
    return data;
  } catch {
    return fetchFn();
  }
};

const set = async (key, data, ttl = TTL.MEDIUM) => {
  const redis = getRedis();
  if (!redis || !isRedisConnected()) return;

  try {
    await redis.set(key, JSON.stringify(data), "EX", ttl);
  } catch {}
};

const get = async (key) => {
  const redis = getRedis();
  if (!redis || !isRedisConnected()) return null;

  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const del = async (key) => {
  const redis = getRedis();
  if (!redis || !isRedisConnected()) return;

  try {
    await redis.del(key);
  } catch {}
};

const invalidatePattern = async (pattern) => {
  const redis = getRedis();
  if (!redis || !isRedisConnected()) return;

  try {
    let cursor = "0";
    do {
      const [newCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100,
      );
      cursor = newCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch {}
};

const increment = async (key, ttl = TTL.VERY_LONG) => {
  const redis = getRedis();
  if (!redis || !isRedisConnected()) return null;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, ttl);
    }
    return count;
  } catch {
    return null;
  }
};

const KEYS = {
  userProfile: (userId) => `user:${userId}:profile`,
  userDashboard: (userId) => `dashboard:${userId}:stats`,
  userDashboardQuick: (userId) => `dashboard:${userId}:quick`,
  userItems: (userId) => `user:${userId}:items`,
  userBookmarks: (userId) => `user:${userId}:bookmarks`,

  item: (itemId) => `item:${itemId}`,
  itemsList: (page, limit, type, category, status) =>
    `items:list:${page}:${limit}:${type || "all"}:${category || "all"}:${status || "all"}`,
  itemClaims: (itemId) => `item:${itemId}:claims`,

  explore: (query) => `explore:${query}`,
  locationSearch: (lng, lat, dist) => `geo:${lng}:${lat}:${dist}`,

  rateLimit: (ip, route) => `rl:${ip}:${route}`,
};

export { TTL, KEYS };
export default {
  getOrSet,
  set,
  get,
  del,
  invalidatePattern,
  increment,
  TTL,
  KEYS,
};
