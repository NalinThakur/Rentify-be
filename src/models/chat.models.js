import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    
    text: {
      type: String,
      required: true,
        },
    attachments: 
      {
      type: String, // URL of file/image
      },
        
       
  },
  { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);
