import mongoose,{Schema} from "mongoose"
const reviewSchema=new Schema(
    {
        userId:{
            type:Schema.Types.ObjectId,
            ref:"User"

        },
        listingId:{
            type:Schema.Types.ObjectId,
            ref:"Listing"

        },
        rating:{
            type:Number,
            min:1,
            max:5,
            required:true
        },
        content:{
            type:String,
            required:true,
        },
        likes:{
            type:Schema.Types.ObjectId,
            ref:"Likes"

        }

    },{timestamps:true})

export const Review=mongoose.model("Review",reviewSchema)