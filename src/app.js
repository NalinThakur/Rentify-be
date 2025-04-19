import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app=express()

app.use(cors({
    origin: "*",
    // credentials:true
}))

app.use(express.json({limit:"50mb"}))
app.use(express.urlencoded({extended:true , limit:"50mb"}))
app.use(express.static("public"))
app.use(cookieParser())


import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/users.routes.js"
import messageRoutes from "./routes/chat.routes.js"
import listingRouter from "./routes/listing.routes.js"



app.use("/api/v1/auth",authRouter)
app.use("/api/v1/user",userRouter)
app.use("/api/v1/message",messageRoutes)
app.use("/api/v1/listing",listingRouter)





export {app}