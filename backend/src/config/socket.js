import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.model.js";
import { getRedis, isRedisConnected } from "./redis.js";

const users = new Map();
const ONLINE_KEY = "online_users";
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
let io;

async function setUserOnline(userId, socketId) {
  users.set(userId, socketId);
  const redis = getRedis();
  if (redis && isRedisConnected()) {
    await redis.hset(ONLINE_KEY, userId, socketId).catch(() => {});
  }
}

async function setUserOffline(userId) {
  users.delete(userId);
  const redis = getRedis();
  if (redis && isRedisConnected()) {
    await redis.hdel(ONLINE_KEY, userId).catch(() => {});
  }
}

async function getSocketId(userId) {
  const local = users.get(userId);
  if (local) return local;

  const redis = getRedis();
  if (redis && isRedisConnected()) {
    return redis.hget(ONLINE_KEY, userId).catch(() => null);
  }
  return null;
}

export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    setUserOnline(userId, socket.id);
    socket.broadcast.emit("user:online", { userId });
    socket.join(`user:${userId}`);

    socket.on("message:send", async (data) => {
      try {
        const { recipientId, content, itemId } = data;

        if (!recipientId || !content) {
          socket.emit("error", {
            message: "Recipient and content are required",
          });
          return;
        }

        const conversationId = Message.generateConversationId(
          userId,
          recipientId,
          itemId,
        );

        const message = await Message.create({
          conversationId,
          sender: userId,
          recipient: recipientId,
          content,
          itemReference: itemId || null,
        });

        const populatedMessage = await Message.findById(message._id)
          .populate("sender", "_id username email profilePicture trustScore")
          .populate("recipient", "_id username email profilePicture trustScore")
          .populate("itemReference", "title type images");

        socket.emit("message:received", populatedMessage);

        const recipientSocketId = await getSocketId(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("message:received", populatedMessage);
        }
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing:start", (data) => {
      const { recipientId } = data;
      getSocketId(recipientId).then((recipientSocketId) => {
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("typing:start", { userId });
        }
      });
    });

    socket.on("typing:stop", (data) => {
      const { recipientId } = data;
      getSocketId(recipientId).then((recipientSocketId) => {
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("typing:stop", { userId });
        }
      });
    });

    socket.on("message:read", async (data) => {
      try {
        const { messageId, otherUserId, itemId } = data;

        const conversationId = Message.generateConversationId(
          userId,
          otherUserId,
          itemId,
        );

        await Message.updateMany(
          {
            conversationId,
            recipient: userId,
            isRead: false,
          },
          {
            isRead: true,
            readAt: new Date(),
          },
        );

        const senderSocketId = await getSocketId(otherUserId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("message:read", {
            conversationId,
            readBy: userId,
          });
        }
      } catch (error) {}
    });

    socket.on("disconnect", () => {
      setUserOffline(userId);
      socket.broadcast.emit("user:offline", { userId });
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}
