const express = require("express");
const router = express.Router();
const interactionController = require("../controllers/interaction.controller");
const { authenticateToken, authorizeRoles } = require("../lib/auth-middleware");
const { asyncHandler } = require("../utils/helpers");

// PUBLIC ROUTES (No auth needed)
router.get("/rooms/:roomId/reviews", asyncHandler(interactionController.getReviews));
router.post("/contact", asyncHandler(interactionController.createContactRequest));

// STUDENT ONLY ROUTES
router.post("/reports", authenticateToken, authorizeRoles("STUDENT"), asyncHandler(interactionController.createReport));
router.get("/my/reports", authenticateToken, asyncHandler(interactionController.getMyReports)); // Actually any user can see their reports, keeping original logic

router.get("/favorites", authenticateToken, authorizeRoles("STUDENT"), asyncHandler(interactionController.getFavorites));
router.post("/favorites/:roomId", authenticateToken, authorizeRoles("STUDENT"), asyncHandler(interactionController.addFavorite));
router.delete("/favorites/:roomId", authenticateToken, authorizeRoles("STUDENT"), asyncHandler(interactionController.removeFavorite));

router.post("/rooms/:roomId/reviews", authenticateToken, authorizeRoles("STUDENT"), asyncHandler(interactionController.createReview));

// ALL AUTHENTICATED USERS
router.get("/notifications", authenticateToken, asyncHandler(interactionController.getNotifications));
router.patch("/notifications/:id/read", authenticateToken, asyncHandler(interactionController.markNotificationRead));

module.exports = router;
