import mongoose,{Schema} from "mongoose";
const listingSchema=new Schema({
    title:{
        type:String,
        required:true
        
    },
    description:{
        type:String
    },

    price:{
        type:String,
        required:true
    },
    category:{
        type:String,
        enum:["furniture","houses","electronics","vehcile"]

    },
    location:{
        type:String,
        required:true
    },
    images:{
        type:String,
        required:true
    },
    availability:{
        type:Boolean,
        required:true
    },
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User"
    }

 
    
    
    
},{timestamps:true})
export const Listing=mongoose.model("Listing",listingSchema)