import { randomUUID } from "crypto";

const logger = (req, res, next) => {
  const start = Date.now();
  const requestId = req.headers["x-request-id"] || randomUUID();
  const slowThreshold = parseInt(process.env.LOG_SLOW_MS || "1000", 10);

  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const line = `[${new Date().toISOString()}] ${requestId} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;

    if (res.statusCode >= 500) {
      console.error(line);
      return;
    }

    if (duration >= slowThreshold) {
      console.warn(`${line} slow`);
      return;
    }

    console.info(line);
  });

  next();
};

export default logger;
