import { createServer } from "http";
import app from "./app.js";
import connectDatabase from "./config/db.js";
import connectRedis, { getRedis } from "./config/redis.js";
import { initializeSocket } from "./config/socket.js";
import chalk from "chalk";
import figlet from "figlet";
import mongoose from "mongoose";

const PORT = parseInt(process.env.PORT || "4500", 10);
const NODE_ENV = process.env.NODE_ENV || "development";
let isShuttingDown = false;

const shutdown = async (signal, error) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  if (error) {
    console.error(`\n${signal} triggered shutdown due to error:`, error);
  } else {
    console.log(`\n${signal} received, shutting down gracefully...`);
  }

  const closeHttpServer =
    server && server.listening
      ? new Promise((resolve) => server.close(resolve))
      : Promise.resolve();

  closeHttpServer
    .then(async () => {
      try {
        await mongoose.connection.close();
        const redis = getRedis();
        if (redis) {
          await redis.quit();
        }
      } catch (err) {
        console.error("Error during shutdown:", err);
      } finally {
        process.exit(error ? 1 : 0);
      }
    })
    .catch(() => process.exit(error ? 1 : 0));

  setTimeout(() => {
    console.warn("Forcing shutdown after 10s timeout");
    process.exit(error ? 1 : 0);
  }, 10000).unref();
};

let server;

try {
  await connectDatabase();
  connectRedis();

  server = createServer(app);
  initializeSocket(server);

  server.listen(PORT, () => {
    console.log(
      chalk.cyan(
        figlet.textSync("SERVER ON", {
          font: "Standard",
          horizontalLayout: "default",
        }),
      ),
    );
    console.log(
      chalk.green.bold(`Server running on port ${PORT} in ${NODE_ENV} mode`),
    );
  });
} catch (error) {
  await shutdown("Startup failure", error);
}

["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

process.on("unhandledRejection", (reason) => {
  shutdown(
    "unhandledRejection",
    reason instanceof Error ? reason : new Error(String(reason)),
  );
});

process.on("uncaughtException", (error) => {
  shutdown("uncaughtException", error);
});
