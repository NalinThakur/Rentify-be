import {Router} from "express"
import { createListing ,reviewing} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/verifyJwt.middlewares.js"; // Adjust the path as needed

const router=Router();
router.route("/createListing").post(
    upload.fields([
        {name:"images",maxCount:5}
    ]),
    verifyJWT,createListing
)

router.route("/reviewing/:listingId").post(verifyJWT,reviewing)





export default router