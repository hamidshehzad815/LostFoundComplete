import express from "express";
import messageController from "../controllers/message.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authenticate);

router.get("/conversations", messageController.getConversations);

router.get("/:otherUserId", messageController.getMessages);

router.post("/", messageController.sendMessage);

router.patch("/:otherUserId/read", messageController.markAsRead);

router.get("/unread/count", messageController.getUnreadCount);

router.patch("/:otherUserId/hide", messageController.hideConversation);

router.delete("/:otherUserId", messageController.deleteConversation);

export default router;
