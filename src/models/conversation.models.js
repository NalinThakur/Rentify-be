import mongoose, { Schema } from "mongoose";

const conversationSchema = new Schema(
  {
    participants: [{
      type: Schema.Types.ObjectId,
      ref: "User"
    }],
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: false,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Chat"
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  { timestamps: true }
);

// Ensure participants are unique and indexed
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

export const Conversation = mongoose.model("Conversation", conversationSchema); 