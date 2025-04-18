import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {app} from './app.js'
import { server } from "./socket.js";

dotenv.config()

connectDB()
.then(()=>{
    app.listen(process.env.PORT ||8100,()=>{
        console.log(`Server is running at port :${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MONGODB connection failed !!!",err);
})