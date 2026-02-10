import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import itemRoutes from "./routes/item.routes.js";
import messageRoutes from "./routes/message.routes.js";
import passport, { initializePassport } from "./config/passport.js";
import { errorHandler, notFound } from "./middlewares/error.middleware.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mkdirSync } from "fs";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";
import securityHeaders from "./middlewares/securityHeaders.middleware.js";
import logger from "./middlewares/logger.middleware.js";
import mongoose from "mongoose";
import { getRedisHealth } from "./config/redis.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

initializePassport();

const app = express();
const allowedOrigins = (
  process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (
  process.env.FRONTEND_URL &&
  !allowedOrigins.includes(process.env.FRONTEND_URL)
) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const prodFrontend = "https://lost-found-complete.vercel.app";
if (!allowedOrigins.includes(prodFrontend)) {
  allowedOrigins.push(prodFrontend);
}

try {
  mkdirSync(join(__dirname, "../uploads/profiles"), { recursive: true });
  mkdirSync(join(__dirname, "../uploads/items"), { recursive: true });
} catch (err) {}

app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(securityHeaders);
app.use(logger);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(passport.initialize());

app.options(
  "/{*splat}",
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(
  "/uploads",
  express.static(join(__dirname, "../uploads"), {
    maxAge: "1d",
    etag: true,
  }),
);

app.get("/healthz", async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const redisHealth = await getRedisHealth();

  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dependencies: {
      mongo: {
        ok: mongoState === 1,
        state: mongoState,
      },
      redis: redisHealth,
    },
  });
});

app.use("/auth/api", apiLimiter);
app.use("/api", apiLimiter);

app.use("/auth/api", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/messages", messageRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
