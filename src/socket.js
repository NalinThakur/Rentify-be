import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://127.0.0.1:5500", "https://goku21g.github.io/Rentify"],
        credentials: true
    },
    pingTimeout: 60000
});

const userSocketMap = {}; // { userId: socketId }

// Function to get the receiver's socket ID
export function getRecieverSocketId(userId) {
    return userSocketMap[userId.toString()];
}

// Socket.IO connection
io.on("connection", (socket) => {
    console.log("New socket connection:", socket.id);
    
    // Auth middleware for socket
    socket.use(([event, data], next) => {
        if (event === "setup") return next();
        
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Not authenticated. No token provided"));
        }
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch (error) {
            next(new Error("Not authenticated. Invalid token"));
        }
    });
    
    // Handle authentication errors
    socket.on("error", (err) => {
        if (err && err.message === "Not authenticated") {
            socket.disconnect();
        }
    });
    
    // Set up user connection
    socket.on("setup", (userData) => {
        if (!userData?._id) return;
        
        const userId = userData._id.toString();
        socket.userId = userId;
        socket.join(userId);
        userSocketMap[userId] = socket.id;
        console.log(`User ${userId} connected, socket: ${socket.id}`);
        
        // Broadcast online users
        io.emit("usersOnline", Object.keys(userSocketMap));
    });
    
    // Join a conversation room
    socket.on("joinConversation", (conversationId) => {
        if (!conversationId) return;
        
        socket.join(conversationId);
        console.log(`User ${socket.userId} joined conversation: ${conversationId}`);
    });
    
    // Leave a conversation room
    socket.on("leaveConversation", (conversationId) => {
        socket.leave(conversationId);
        console.log(`User ${socket.userId} left conversation: ${conversationId}`);
    });
    
    // Handle typing indicator
    socket.on("typing", ({ conversationId, receiverId }) => {
        const receiverSocketId = getRecieverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("typing", {
                conversationId,
                senderId: socket.userId
            });
        }
    });
    
    // Handle stop typing
    socket.on("stopTyping", ({ conversationId, receiverId }) => {
        const receiverSocketId = getRecieverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("stopTyping", {
                conversationId,
                senderId: socket.userId
            });
        }
    });
    
    // Handle disconnect
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
        if (socket.userId) {
            delete userSocketMap[socket.userId];
            // Broadcast updated online users
            io.emit("usersOnline", Object.keys(userSocketMap));
        }
    });
});

export { io, app, server };  