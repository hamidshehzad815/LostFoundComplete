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

const toId = (value) => (value == null ? "" : String(value));

function userRoom(userId) {
  return `user:${toId(userId)}`;
}

async function setUserOnline(userId, socketId) {
  const id = toId(userId);
  users.set(id, socketId);
  const redis = getRedis();
  if (redis && isRedisConnected()) {
    await redis.hset(ONLINE_KEY, id, socketId).catch(() => {});
  }
}

async function setUserOffline(userId) {
  const id = toId(userId);
  users.delete(id);
  const redis = getRedis();
  if (redis && isRedisConnected()) {
    await redis.hdel(ONLINE_KEY, id).catch(() => {});
  }
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
      socket.userId = toId(decoded.id);
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = toId(socket.userId);

    setUserOnline(userId, socket.id);
    socket.join(userRoom(userId));
    socket.broadcast.emit("user:online", { userId });

    socket.on("message:send", async (data) => {
      try {
        const recipientId = toId(data?.recipientId);
        const content = data?.content?.trim?.() || data?.content;
        const itemId = data?.itemId ? toId(data.itemId) : null;

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
          .populate("itemReference", "title type images status")
          .lean();

        // Room-based delivery is reliable even if socket-id maps are stale.
        io.to(userRoom(userId)).emit("message:received", populatedMessage);
        if (recipientId !== userId) {
          io.to(userRoom(recipientId)).emit(
            "message:received",
            populatedMessage,
          );
        }
      } catch (error) {
        console.error("message:send failed:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing:start", (data) => {
      const recipientId = toId(data?.recipientId);
      if (!recipientId) return;
      io.to(userRoom(recipientId)).emit("typing:start", { userId });
    });

    socket.on("typing:stop", (data) => {
      const recipientId = toId(data?.recipientId);
      if (!recipientId) return;
      io.to(userRoom(recipientId)).emit("typing:stop", { userId });
    });

    socket.on("message:read", async (data) => {
      try {
        const otherUserId = toId(data?.otherUserId);
        const itemId = data?.itemId ? toId(data.itemId) : null;
        if (!otherUserId) return;

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

        io.to(userRoom(otherUserId)).emit("message:read", {
          conversationId,
          readBy: userId,
        });
      } catch (error) {
        console.error("message:read failed:", error);
      }
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
