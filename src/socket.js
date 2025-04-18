import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // Update with your frontend URL
    }
});

const userSocketMap = {}; // { userId: socketId }

// Function to get the receiver's socket ID
export function getRecieverSocketId(userId) {
    return userSocketMap[userId];
}

// Socket.IO connection
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    const userId = socket.handshake.query.userId;
    if (userId) {
        userSocketMap[userId] = socket.id;
    }

    // Notify all clients about online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // 🔴 LISTEN FOR MESSAGES
    socket.on("sendMessage", ({ senderId, recieverId, text, image }) => {
        const recieverSocketId = getRecieverSocketId(recieverId);
        if (recieverSocketId) {
            io.to(recieverSocketId).emit("newMessage", { senderId, text, image });
        }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
});

export { io, app, server };  