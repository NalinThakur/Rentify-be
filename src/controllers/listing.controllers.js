import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Listing } from "../models/listing.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Get all listings with optional filtering
export const getAllListings = asyncHandler(async (req, res) => {
  try {
    const listings = await Listing.find({})
      .populate("owner", "name email");
    
    return res.status(200).json({
      success: true,
      data: listings,
      message: "Listings fetched successfully"
    });
  } catch (error) {
    throw new ApiError(500, "Error fetching listings: " + error.message);
  }
});

// Get a single listing by ID
export const getListingById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const listing = await Listing.findById(id).populate("owner", "name email");
  
  if (!listing) {
    throw new ApiError(404, "Listing not found");
  }
  
  return res.status(200).json({
    success: true,
    data: listing,
    message: "Listing fetched successfully"
  });
});

// Get listings by category
export const getListingsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  
  const listings = await Listing.find({ category })
    .populate("owner", "name email");
  
  return res.status(200).json({
    success: true,
    data: listings,
    message: `${category} listings fetched successfully`
  });
});

// Get listings for the logged-in user
export const getListingsByOwner = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const listings = await Listing.find({ owner: userId });
  
  return res.status(200).json({
    success: true,
    data: listings,
    message: "Your listings fetched successfully"
  });
});

// Create a new listing
export const createListing = asyncHandler(async (req, res) => {
  const { title, description, price, category, location, availability } = req.body;
  
  if (!title || !price || !location) {
    throw new ApiError(400, "Title, price and location are required");
  }
  
  // Handle image upload
  let imageUrl;
  if (req.file) {
    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (!uploadResult) {
      throw new ApiError(500, "Image upload failed");
    }
    imageUrl = uploadResult.url;
  } else {
    throw new ApiError(400, "Image is required");
  }
  
  const listing = await Listing.create({
    title,
    description,
    price,
    category,
    location,
    images: imageUrl,
    availability: availability === "true",
    owner: req.user._id
  });
  
  return res.status(201).json({
    success: true,
    data: listing,
    message: "Listing created successfully"
  });
});

// Update a listing
export const updateListing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, price, category, location, availability } = req.body;
  
  const listing = await Listing.findById(id);
  
  if (!listing) {
    throw new ApiError(404, "Listing not found");
  }
  
  // Verify ownership
  if (listing.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this listing");
  }
  
  // Update fields if provided
  if (title) listing.title = title;
  if (description) listing.description = description;
  if (price) listing.price = price;
  if (category) listing.category = category;
  if (location) listing.location = location;
  if (availability !== undefined) listing.availability = availability === "true";
  
  // Handle image upload if new image is provided
  if (req.file) {
    const uploadResult = await uploadOnCloudinary(req.file.path);
    if (!uploadResult) {
      throw new ApiError(500, "Image upload failed");
    }
    listing.images = uploadResult.url;
  }
  
  await listing.save();
  
  return res.status(200).json({
    success: true,
    data: listing,
    message: "Listing updated successfully"
  });
});

// Delete a listing
export const deleteListing = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const listing = await Listing.findById(id);
  
  if (!listing) {
    throw new ApiError(404, "Listing not found");
  }
  
  // Verify ownership
  if (listing.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this listing");
  }
  
  await Listing.findByIdAndDelete(id);
  
  return res.status(200).json({
    success: true,
    data: {},
    message: "Listing deleted successfully"
  });
}); 