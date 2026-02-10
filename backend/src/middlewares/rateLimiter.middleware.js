import cache from "../utils/cache.js";

const rateLimiter = ({
  windowMs = 60000,
  max = 100,
  message = "Too many requests, please try again later",
  keyPrefix = "general",
} = {}) => {
  return async (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `rl:${keyPrefix}:${ip}`;
    const windowSec = Math.ceil(windowMs / 1000);

    const count = await cache.increment(key, windowSec);

    if (count === null) {
      return next();
    }

    res.set("X-RateLimit-Limit", max);
    res.set("X-RateLimit-Remaining", Math.max(0, max - count));

    if (count > max) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};

export const apiLimiter = rateLimiter({
  windowMs: 60000,
  max: 100,
  keyPrefix: "api",
});

export const authLimiter = rateLimiter({
  windowMs: 900000,
  max: 15,
  keyPrefix: "auth",
  message: "Too many login attempts, please try again in 15 minutes",
});

export const uploadLimiter = rateLimiter({
  windowMs: 3600000,
  max: 30,
  keyPrefix: "upload",
  message: "Upload limit reached, please try again later",
});

export default rateLimiter;
