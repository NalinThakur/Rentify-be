import {Listing} from"../models/listing.models.js"
import { User } from "../models/user.models.js"
import{Community} from "../models/community.models.js"
import {Review} from"../models/review.models.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/apiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"


const createListing=asyncHandler(async(req,res)=>{
    const owner=req.user._id;
    const{title,description,price,category,location,availability}=req.body

    if([title,description,category,location].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are required")

    }
    if(!price) {
        throw new ApiError(400, "Price is required");
    }
    
    if(!availability) {
        throw new ApiError(400, "Availability is required");
    }
    const imagesLocalPath=req.files?.images[0]?.path;
    if(!imagesLocalPath){
        throw new ApiError(400,"Upload images of your product")
    }
    const image=await uploadOnCloudinary(imagesLocalPath) ;

    const listing=await Listing.create({
        title,
        description,
        price,
        category,
        location,
        images:image.url,
        availability,
        owner

    })
    return res.status(200)
    .json({status:200,message:"Product uploaded",data:listing})


});


const reviewing=asyncHandler(async(req,res)=>{
    const userId=req.user._id;
    const{listingId}=req.params
    const{content,rating}=req.body

    if(!userId||!listingId){
        throw new ApiError(404,"Something went wrong")
    }
    if(!content){
        throw new ApiError(404,"Content is empty")
    }
    if(!rating){
        throw new ApiError(404,"Pleae rate the product")
    }

    const review=await Review.create({
        userId,
        listingId,
        content,
        rating
    })
    await Review.findByIdAndUpdate(listingId,{$inc:{reviewsCount:1}})
    return res.status(200).json({
        status: 200,
        message: "Product reviewed Successfully",
        data: review
    });

})
export {createListing,reviewing}