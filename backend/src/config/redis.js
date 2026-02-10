import Redis from "ioredis";
import chalk from "chalk";

let redis = null;
let isConnected = false;
let hasLoggedError = false;

const connectRedis = () => {
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.REDIS_URL &&
    !process.env.REDIS_HOST
  ) {
    console.log(
      chalk.yellow(
        "Redis not configured (REDIS_URL or REDIS_HOST). Caching and rate limits will be bypassed.",
      ),
    );
  }

  const connectionOptions = process.env.REDIS_URL
    ? process.env.REDIS_URL
    : {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
      };

  const commonOptions = {
    retryStrategy(times) {
      if (times > 3) {
        return null;
      }
      return Math.min(times * 500, 3000);
    },
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: false,
  };

  redis = process.env.REDIS_URL
    ? new Redis(connectionOptions, commonOptions)
    : new Redis({ ...connectionOptions, ...commonOptions });

  redis.on("connect", () => {
    isConnected = true;
    hasLoggedError = false;
    console.log(chalk.red.bold("⚡ Redis Connected"));
  });

  redis.on("error", (err) => {
    isConnected = false;
    if (!hasLoggedError) {
      hasLoggedError = true;
      console.log(
        chalk.yellow("Redis unavailable — running without cache:"),
        err.message,
      );
    }
  });

  redis.on("close", () => {
    isConnected = false;
  });

  return redis;
};

export const getRedis = () => redis;

export const isRedisConnected = () => isConnected;

export const getRedisHealth = async () => {
  if (!redis || !isConnected) {
    return { ok: false, status: "disconnected" };
  }

  const start = Date.now();
  try {
    const pong = await redis.ping();
    return {
      ok: pong === "PONG",
      status: pong,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return { ok: false, status: "error", error: error.message };
  }
};

export default connectRedis;
