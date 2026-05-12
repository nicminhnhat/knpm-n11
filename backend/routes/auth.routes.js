const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authenticateToken } = require("../lib/auth-middleware");
const { asyncHandler } = require("../utils/helpers");

router.post("/register", asyncHandler(authController.register));
router.post("/login", asyncHandler(authController.login));
router.get("/me", authenticateToken, authController.me);
router.post("/logout", authenticateToken, authController.logout);
router.post("/forgot-password", asyncHandler(authController.forgotPassword));
router.post("/verify-reset-otp", asyncHandler(authController.verifyResetOtp));
router.post("/reset-password", asyncHandler(authController.resetPassword));

module.exports = router;
