import { Schema as _Schema, model } from "mongoose";
const Schema = _Schema;

const MessageSchema = new Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    itemReference: {
      type: Schema.Types.ObjectId,
      ref: "Item",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    hiddenBy: {
      type: [Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, recipient: 1 });

MessageSchema.statics.generateConversationId = function (
  userId1,
  userId2,
  itemId = null,
) {
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  if (itemId) {
    return `${sortedIds[0]}_${sortedIds[1]}_${itemId.toString()}`;
  }
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

const Message = model("Message", MessageSchema);

export default Message;
