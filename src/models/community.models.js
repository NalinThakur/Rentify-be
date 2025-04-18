import mongoose,{Schema} from "mongoose";
const communitySchema=new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,

    },
    members:[{
        type:Schema.Types.ObjectId,
        ref:"User"
    }
    ]
        
    

    

})
export const Community=mongoose.model("Community",communitySchema)

