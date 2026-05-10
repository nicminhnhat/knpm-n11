const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { authenticateToken, authorizeRoles } = require("../lib/auth-middleware");
const { asyncHandler } = require("../utils/helpers");

router.use(authenticateToken, authorizeRoles("ADMIN"));

router.get("/ping", (req, res) => res.json({ success: true, message: "Admin route ok" }));
router.get("/dashboard", asyncHandler(adminController.getDashboardStats));

router.get("/users", asyncHandler(adminController.getUsers));
router.get("/users/:id", asyncHandler(adminController.getUserById));
router.patch("/users/:id/lock", asyncHandler(adminController.lockUser));
router.patch("/users/:id/unlock", asyncHandler(adminController.unlockUser));

router.get("/posts", asyncHandler(adminController.getPosts));
router.get("/posts/:id", asyncHandler(adminController.getPostById));
router.patch("/posts/:id/moderate", asyncHandler(adminController.moderatePost));

router.get("/verifications", asyncHandler(adminController.getVerifications));
router.patch("/verifications/:id", asyncHandler(adminController.moderateVerification));

router.get("/reports", asyncHandler(adminController.getReports));
router.patch("/reports/:id/resolve", asyncHandler(adminController.resolveReport));

module.exports = router;
