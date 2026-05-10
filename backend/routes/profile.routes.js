const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile.controller");
const { authenticateToken } = require("../lib/auth-middleware");
const { asyncHandler } = require("../utils/helpers");

router.get("/", authenticateToken, profileController.getProfile);
router.put("/", authenticateToken, asyncHandler(profileController.updateProfile));
router.put("/change-password", authenticateToken, asyncHandler(profileController.changePassword));

module.exports = router;
