import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    listingId: {
      type: Schema.Types.ObjectId,
      ref: "Listing",
      required: false, // Optional reference to a listing
    },
    text: {
      type: String,
      required: true,
    },
    attachment: {
      type: String, // URL of file/image
      required: false,
    },
    read: {
      type: Boolean,
      default: false,
    }
  },
  { timestamps: true }
);

// Index to improve query performance
chatSchema.index({ senderId: 1, receiverId: 1 });
chatSchema.index({ createdAt: -1 });

export const Chat = mongoose.model("Chat", chatSchema);
