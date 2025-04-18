import {Router} from "express";
import { loginUser,logoutUser,registerUser } from "../controllers/auth.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js"
import {verifyJWT} from"../middlewares/verifyJwt.middlewares.js"

const router=Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
      ]),
      registerUser
    )
    
    router.route("/login").post(loginUser);
    
    // The logout route is protected by verifyJWT so that req.user is available
    router.route("/logout").post(verifyJWT, logoutUser);
    
    export default router;
    