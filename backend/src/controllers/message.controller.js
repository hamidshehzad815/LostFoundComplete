import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import { resolveMediaArray, resolveMediaUrl } from "../config/r2.js";

class MessageController {
  async getConversations(req, res, next) {
    try {
      const userId = new mongoose.Types.ObjectId(req.user.id);

      const messages = await Message.aggregate([
        {
          $match: {
            $or: [{ sender: userId }, { recipient: userId }],
            hiddenBy: { $ne: userId },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: "$conversationId",
            lastMessage: { $first: "$$ROOT" },
            unreadCount: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$recipient", userId] },
                      { $eq: ["$isRead", false] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: { "lastMessage.createdAt": -1 },
        },
      ]);

      const conversations = await Promise.all(
        messages.map(async (conv) => {
          const isSender =
            conv.lastMessage.sender.toString() === userId.toString();
          const otherUserId = isSender
            ? conv.lastMessage.recipient
            : conv.lastMessage.sender;

          const otherUser = await User.findById(otherUserId).select(
            "_id username email profilePicture trustScore",
          );

          if (!otherUser) {
            return null;
          }

          let itemRef = null;
          if (conv.lastMessage.itemReference) {
            const Item = (await import("../models/item.model.js")).default;
            itemRef = await Item.findById(
              conv.lastMessage.itemReference,
            ).select("_id title type images status");
          }

          const resolvedProfilePicture = await resolveMediaUrl(
            otherUser.profilePicture,
          );
          const resolvedItemImages = itemRef?.images
            ? await resolveMediaArray(itemRef.images)
            : itemRef?.images;

          return {
            conversationId: conv._id,
            otherUser: {
              _id: otherUser._id,
              username: otherUser.username,
              email: otherUser.email,
              profilePicture: resolvedProfilePicture,
              trustScore: otherUser.trustScore,
            },
            lastMessage: {
              content: conv.lastMessage.content,
              createdAt: conv.lastMessage.createdAt,
              isFromMe: isSender,
            },
            itemReference: itemRef
              ? { ...itemRef.toObject?.(), images: resolvedItemImages }
              : itemRef,
            unreadCount: conv.unreadCount,
          };
        }),
      );

      const validConversations = conversations.filter((conv) => conv !== null);

      res.status(200).json({
        success: true,
        data: validConversations,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const userId = req.user.id;
      const { otherUserId } = req.params;
      const { page = 1, limit = 50, itemId } = req.query;

      const conversationId = Message.generateConversationId(
        userId,
        otherUserId,
        itemId,
      );

      const skip = (page - 1) * limit;

      const [messages, total] = await Promise.all([
        Message.find({
          conversationId,
          hiddenBy: { $ne: userId },
        })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .populate("sender", "username profilePicture")
          .populate("recipient", "username profilePicture")
          .populate("itemReference", "title type images"),
        Message.countDocuments({ conversationId }),
      ]);

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

      res.status(200).json({
        success: true,
        data: await Promise.all(
          messages
            .reverse()
            .map(async (message) => {
              const normalized = message.toObject?.() || message;
              if (normalized.sender?.profilePicture) {
                normalized.sender.profilePicture = await resolveMediaUrl(
                  normalized.sender.profilePicture,
                );
              }
              if (normalized.recipient?.profilePicture) {
                normalized.recipient.profilePicture = await resolveMediaUrl(
                  normalized.recipient.profilePicture,
                );
              }
              if (normalized.itemReference?.images) {
                normalized.itemReference.images = await resolveMediaArray(
                  normalized.itemReference.images,
                );
              }
              return normalized;
            }),
        ),
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const userId = req.user.id;
      const { recipientId, content, itemId } = req.body;

      if (!recipientId || !content) {
        return res.status(400).json({
          success: false,
          message: "Recipient and content are required",
        });
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
        .populate("sender", "username profilePicture")
        .populate("recipient", "username profilePicture")
        .populate("itemReference", "title type images");

      res.status(201).json({
        success: true,
        data: await (async () => {
          const normalized = populatedMessage.toObject?.() || populatedMessage;
          if (normalized.sender?.profilePicture) {
            normalized.sender.profilePicture = await resolveMediaUrl(
              normalized.sender.profilePicture,
            );
          }
          if (normalized.recipient?.profilePicture) {
            normalized.recipient.profilePicture = await resolveMediaUrl(
              normalized.recipient.profilePicture,
            );
          }
          if (normalized.itemReference?.images) {
            normalized.itemReference.images = await resolveMediaArray(
              normalized.itemReference.images,
            );
          }
          return normalized;
        })(),
      });
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { otherUserId } = req.params;
      const { itemId } = req.query;

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

      res.status(200).json({
        success: true,
        message: "Messages marked as read",
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;

      const count = await Message.countDocuments({
        recipient: userId,
        isRead: false,
      });

      res.status(200).json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteConversation(req, res, next) {
    try {
      const userId = req.user.id;
      const { otherUserId } = req.params;
      const { itemId } = req.query;

      const conversationId = Message.generateConversationId(
        userId,
        otherUserId,
        itemId,
      );

      await Message.deleteMany({ conversationId });

      res.status(200).json({
        success: true,
        message: "Conversation deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async hideConversation(req, res, next) {
    try {
      const userId = req.user.id;
      const { otherUserId } = req.params;
      const { itemId } = req.query;

      const conversationId = Message.generateConversationId(
        userId,
        otherUserId,
        itemId,
      );

      await Message.updateMany(
        { conversationId },
        { $addToSet: { hiddenBy: userId } },
      );

      res.status(200).json({
        success: true,
        message: "Conversation hidden successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new MessageController();
