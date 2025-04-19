import { Router } from "express";
import { verifyJWT } from "../middlewares/verifyJwt.middlewares.js";
import { 
  getUsers, 
  getConversations,
  getMessages, 
  sendMessage, 
  markAsRead,
  getUnreadCount,
  startListingConversation
} from "../controllers/chat.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";

const messageRoutes = Router();

// Get all chat users
messageRoutes.route("/users").get(verifyJWT, getUsers);

// Get all conversations
messageRoutes.route("/conversations").get(verifyJWT, getConversations);

// Get messages between current user and another user
messageRoutes.route("/messages/:userId").get(verifyJWT, getMessages);

// Send message to user
messageRoutes.route("/send/:userId").post(
  verifyJWT, 
  upload.single("attachment"), 
  sendMessage
);

// Mark messages as read
messageRoutes.route("/read/:conversationId").patch(verifyJWT, markAsRead);

// Get unread message count
messageRoutes.route("/unread").get(verifyJWT, getUnreadCount);

// Start a conversation about a listing
messageRoutes.route("/listing/:listingId").post(verifyJWT, startListingConversation);

export default messageRoutes;
