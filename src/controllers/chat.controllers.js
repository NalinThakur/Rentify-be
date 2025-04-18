import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";
import { Chat } from "../models/chat.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiError} from "../utils/apiError.js";
import { getRecieverSocketId, io } from "../socket.js";


export const getUsers = asyncHandler(async (req, res)=>{
    const loggedInUser = req.user._id
    const filtered = await User.find({
        _id: {$ne:loggedInUser}
    }).select("-password")

    res.status(200).json(new ApiResponse(200, filtered, "Users fetched sucessfully!"))

})

export const getMessages = asyncHandler(async (req, res)=>{
    const {id:userToChatId} = req.params

    const myId = req.user._id

    const messages  = await Chat.find({
        $or: [
            {senderId:myId, recieverId:userToChatId},
            {senderId:userToChatId, recieverId: myId}
        ]
    })

    res.status(200).json(messages);

})

export const sendMessage = asyncHandler(async (req, res) =>{
    const {text} = req.body
    const {id: recieverId} = req.params
    const senderId = req.user._id


    const attachmentLocalPath=req.files?.attachments[0]?.path;
    const image=await uploadOnCloudinary(attachmentLocalPath)

    

    const newmsg = await Chat.create({
        senderId, 
        recieverId,
        text,
        image: image?.url
    })

    if(!newmsg){
        throw new ApiError(400, "Error sending message")
    }

    await newmsg.save()

    //realtime functionality with socket
    const recieverSocketId = getRecieverSocketId(recieverId)
    if(recieverSocketId){
        io.to(recieverSocketId).emit("newMessage", newmsg)
    }


    res.status(201).json(newmsg);

    


})

