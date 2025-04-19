import { Router } from "express";
import { 
  getAllListings, 
  getListingById, 
  getListingsByCategory,
  getListingsByOwner,
  createListing, 
  updateListing, 
  deleteListing 
} from "../controllers/listing.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/verifyJwt.middlewares.js";

const router = Router();

// Public routes
router.get('/listings', getAllListings);
router.get('/listings/:id', getListingById);
router.get('/listings/category/:category', getListingsByCategory);

// Protected routes
router.get('/my-listings', verifyJWT, getListingsByOwner);
router.post('/create', verifyJWT, upload.single('image'), createListing);
router.put('/update/:id', verifyJWT, upload.single('image'), updateListing);
router.delete('/delete/:id', verifyJWT, deleteListing);

export default router;