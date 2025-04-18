import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken=async(userId)=>{
    try{
        const user=await User.findById(userId);
        if(!user){
            throw new ApiError(404,"User not found");
        }
        const accessToken=await user.generateAccessToken();
        const refreshToken=await user.generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({validateBeforeSave:false});
        return {accessToken,refreshToken};
    }catch(error){
        console.error("Error generating token:",error);
        throw new ApiError(500,"Something went wrong")
    }
}

const registerUser=asyncHandler(async(req,res)=>{
    const {username,fullname,email,password,phone ,role}=req.body;

    if(
        [username,fullname,email,password,phone ,role].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser=await User.findOne({
        $or:[{phone},{email}]
    })

    if(existedUser){
        throw new ApiError(409,"User with same email or phone number already exists")
    }

    const avatarLocalPath=req.files?.avatar[0]?.path;

    const avatar=await uploadOnCloudinary(avatarLocalPath)

    const user=await User.create({
        fullname,
        username:username.toLowerCase(),
        email,
        password,
        phone,
        avatar:avatar?.url||"",
        role
        
    })

    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong")
    }

    return res.status(201).json({
        status:200,
        data:createdUser,
        message:"User registered successfully"
    });

});
const loginUser=asyncHandler(async(req,res)=>{
    // take data from req body
    //check if username or email is filled
    //find the user
    //check password
    //if password is correct send refresh token and access token to user
    //send cookie
    //else send response
    const {email, phone ,password}=req.body
    
    if(!(phone||email)){
        throw new ApiError(400,"Phone or email is required")
        
    }
    const user=await User.findOne({
        $or:[{phone},{email}]
  })
    if(!user){
        throw new ApiError(404,"User does not exist")
    }
  
    const isPasswordValid =await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }
    const {accessToken,refreshToken}=await 
    generateAccessAndRefreshToken(user._id)
  
    const loggedInUser =await User.findById(user._id).
    select("-password -refreshToken")
  
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)    .json({
        status: 200,
        data: { user: loggedInUser, accessToken, refreshToken },
        message: "User logged in successfully"
      });
  });
  

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {$set:{refreshToken:undefined}},
        {new:true}
    );
    const options={
        httpOnly:true,
        secure:process.env.NODE_ENV==="production"
    };


    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json({
        status:200,
        data:{},
        message:"User logged out successfully"
    })
});
export{registerUser,loginUser,logoutUser};



