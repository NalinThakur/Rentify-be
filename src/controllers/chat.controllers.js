import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";
import { Chat } from "../models/chat.models.js";
import { Conversation } from "../models/conversation.models.js";
import { Listing } from "../models/listing.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiError} from "../utils/apiError.js";
import { getRecieverSocketId, io } from "../socket.js";


export const getUsers = asyncHandler(async (req, res)=>{
    const loggedInUserId = req.user._id
    
    // Find all users that the current user has conversations with
    const conversations = await Conversation.find({
        participants: loggedInUserId
    }).populate({
        path: 'participants',
        match: { _id: { $ne: loggedInUserId } },
        select: 'name email role avatar'
    });
    
    // Extract unique users from conversations
    const users = conversations.map(conv => {
        const otherUser = conv.participants.find(p => p._id.toString() !== loggedInUserId.toString());
        return {
            ...otherUser._doc,
            conversationId: conv._id,
            unreadCount: conv.unreadCount.get(loggedInUserId.toString()) || 0,
            lastUpdated: conv.updatedAt
        };
    });
    
    return res.status(200).json({
        success: true,
        data: users,
        message: "Chat users fetched successfully"
    });
})

export const getConversations = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    
    const conversations = await Conversation.find({
        participants: userId
    })
    .populate({
        path: 'participants',
        match: { _id: { $ne: userId } },
        select: 'name email role avatar'
    })
    .populate('lastMessage')
    .populate('listingId', 'title images price')
    .sort({ updatedAt: -1 });
    
    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
        const otherUser = conv.participants[0]; // Since we filtered to only include the other user
        return {
            _id: conv._id,
            user: otherUser,
            listing: conv.listingId,
            lastMessage: conv.lastMessage,
            unreadCount: conv.unreadCount.get(userId.toString()) || 0,
            updatedAt: conv.updatedAt
        };
    });
    
    return res.status(200).json({
        success: true,
        data: formattedConversations,
        message: "Conversations fetched successfully"
    });
})

export const getMessages = asyncHandler(async (req, res)=>{
    const {userId} = req.params
    const currentUserId = req.user._id
    
    // Find or create conversation
    let conversation = await Conversation.findOne({
        participants: { $all: [currentUserId, userId] }
    });
    
    if (!conversation) {
        return res.status(200).json({
            success: true,
            data: [],
            message: "No messages found"
        });
    }
    
    // Mark messages as read
    if (conversation.unreadCount.get(currentUserId.toString()) > 0) {
        // Update messages read status
        await Chat.updateMany(
            { 
                conversationId: conversation._id,
                senderId: userId,
                receiverId: currentUserId,
                read: false
            },
            { read: true }
        );
        
        // Reset unread count for current user
        conversation.unreadCount.set(currentUserId.toString(), 0);
        await conversation.save();
    }
    
    // Get messages
    const messages = await Chat.find({
        $or: [
            {senderId: currentUserId, receiverId: userId},
            {senderId: userId, receiverId: currentUserId}
        ]
    })
    .sort({createdAt: 1})
    .populate('senderId', 'name avatar')
    .populate('receiverId', 'name avatar');
    
    return res.status(200).json({
        success: true,
        data: messages,
        conversation: conversation._id,
        message: "Messages fetched successfully"
    });
})

export const sendMessage = asyncHandler(async (req, res) =>{
    const {text, listingId} = req.body
    const {userId} = req.params
    const senderId = req.user._id
    
    // Validate users exist
    const receiver = await User.findById(userId);
    if (!receiver) {
        throw new ApiError(404, "Receiver not found");
    }
    
    // Handle attachment if any
    let attachmentUrl = null;
    if (req.file) {
        const uploadResult = await uploadOnCloudinary(req.file.path);
        if (!uploadResult) {
            throw new ApiError(500, "Attachment upload failed");
        }
        attachmentUrl = uploadResult.url;
    }
    
    // Find or create conversation
    let conversation = await Conversation.findOne({
        participants: { $all: [senderId, userId] }
    });
    
    if (!conversation) {
        conversation = await Conversation.create({
            participants: [senderId, userId],
            listingId: listingId || null,
            unreadCount: new Map([[userId, 1]])
        });
    } else {
        // Update unread count
        const currentUnread = conversation.unreadCount.get(userId.toString()) || 0;
        conversation.unreadCount.set(userId.toString(), currentUnread + 1);
    }
    
    // Create message
    const newMessage = await Chat.create({
        senderId, 
        receiverId: userId,
        text,
        attachment: attachmentUrl,
        read: false
    });
    
    // Update conversation with last message
    conversation.lastMessage = newMessage._id;
    await conversation.save();
    
    // Populate sender info for real-time notification
    const populatedMessage = await Chat.findById(newMessage._id)
        .populate('senderId', 'name avatar')
        .populate('receiverId', 'name avatar');
    
    // Real-time notification via socket
    const receiverSocketId = getRecieverSocketId(userId);
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", {
            message: populatedMessage,
            conversation: conversation._id
        });
    }
    
    return res.status(201).json({
        success: true,
        data: populatedMessage,
        message: "Message sent successfully"
    });
})

export const markAsRead = asyncHandler(async (req, res) => {
    const {conversationId} = req.params
    const userId = req.user._id
    
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        throw new ApiError(404, "Conversation not found");
    }
    
    // Get the other participant
    const otherUserId = conversation.participants.find(
        p => p.toString() !== userId.toString()
    );
    
    // Mark messages from other user as read
    await Chat.updateMany(
        {
            senderId: otherUserId,
            receiverId: userId,
            read: false
        },
        { read: true }
    );
    
    // Reset unread count
    conversation.unreadCount.set(userId.toString(), 0);
    await conversation.save();
    
    return res.status(200).json({
        success: true,
        message: "Messages marked as read"
    });
})

export const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user._id
    
    const conversations = await Conversation.find({
        participants: userId
    });
    
    let totalUnread = 0;
    const unreadByConversation = {};
    
    conversations.forEach(conv => {
        const count = conv.unreadCount.get(userId.toString()) || 0;
        totalUnread += count;
        unreadByConversation[conv._id] = count;
    });
    
    return res.status(200).json({
        success: true,
        data: {
            total: totalUnread,
            byConversation: unreadByConversation
        },
        message: "Unread counts fetched successfully"
    });
})

export const startListingConversation = asyncHandler(async (req, res) => {
    const {listingId} = req.params
    const {initialMessage} = req.body
    const senderId = req.user._id
    
    // Find listing and owner
    const listing = await Listing.findById(listingId);
    if (!listing) {
        throw new ApiError(404, "Listing not found");
    }
    
    const ownerId = listing.owner;
    
    // Check if conversation already exists
    let conversation = await Conversation.findOne({
        participants: { $all: [senderId, ownerId] },
        listingId: listingId
    });
    
    if (!conversation) {
        conversation = await Conversation.create({
            participants: [senderId, ownerId],
            listingId: listingId,
            unreadCount: new Map([[ownerId.toString(), 1]])
        });
    } else {
        // Update unread count
        const currentUnread = conversation.unreadCount.get(ownerId.toString()) || 0;
        conversation.unreadCount.set(ownerId.toString(), currentUnread + 1);
    }
    
    // Create initial message
    const message = await Chat.create({
        senderId,
        receiverId: ownerId,
        text: initialMessage || `I'm interested in your listing "${listing.title}"`,
        read: false
    });
    
    // Update conversation
    conversation.lastMessage = message._id;
    await conversation.save();
    
    // Populate message
    const populatedMessage = await Chat.findById(message._id)
        .populate('senderId', 'name avatar')
        .populate('receiverId', 'name avatar');
    
    // Send real-time notification
    const receiverSocketId = getRecieverSocketId(ownerId.toString());
    if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", {
            message: populatedMessage,
            conversation: conversation._id
        });
    }
    
    return res.status(201).json({
        success: true,
        data: {
            conversation: conversation._id,
            message: populatedMessage
        },
        message: "Conversation started successfully"
    });
})

