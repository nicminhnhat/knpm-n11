const express = require("express");
const router = express.Router();
const landlordController = require("../controllers/landlord.controller");
const { authenticateToken, authorizeRoles, requireVerifiedLandlord } = require("../lib/auth-middleware");
const { asyncHandler } = require("../utils/helpers");

// ROOMS
router.get("/rooms", authenticateToken, authorizeRoles("LANDLORD"), asyncHandler(landlordController.getRooms));
router.post("/rooms", authenticateToken, requireVerifiedLandlord, asyncHandler(landlordController.createRoom));
router.get("/rooms/:id", authenticateToken, authorizeRoles("LANDLORD"), asyncHandler(landlordController.getRoomById));
router.put("/rooms/:id", authenticateToken, requireVerifiedLandlord, asyncHandler(landlordController.updateRoom));
router.patch("/rooms/:id/status", authenticateToken, requireVerifiedLandlord, asyncHandler(landlordController.updateRoomStatus));
router.delete("/rooms/:id", authenticateToken, requireVerifiedLandlord, asyncHandler(landlordController.deleteRoom));

// POSTS
router.get("/posts", authenticateToken, authorizeRoles("LANDLORD"), asyncHandler(landlordController.getPosts));
router.post("/posts", authenticateToken, requireVerifiedLandlord, asyncHandler(landlordController.createPost));
router.get("/posts/:id", authenticateToken, authorizeRoles("LANDLORD"), asyncHandler(landlordController.getPostById));
router.put("/posts/:id", authenticateToken, requireVerifiedLandlord, asyncHandler(landlordController.updatePost));
router.patch("/posts/:id/hide", authenticateToken, requireVerifiedLandlord, asyncHandler(landlordController.hidePost));
router.patch("/posts/:id/unhide", authenticateToken, requireVerifiedLandlord, asyncHandler(landlordController.unhidePost));
router.delete("/posts/:id", authenticateToken, requireVerifiedLandlord, asyncHandler(landlordController.deletePost));

// VERIFICATION
router.get("/verification/me", authenticateToken, authorizeRoles("LANDLORD"), asyncHandler(landlordController.getVerificationProfile));
router.post("/verification/requests", authenticateToken, authorizeRoles("LANDLORD"), asyncHandler(landlordController.createVerificationRequest));

module.exports = router;
