const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const { authenticateToken } = require("../lib/auth-middleware");
const { asyncHandler } = require("../utils/helpers");

router.use(authenticateToken);

router.get("/threads", asyncHandler(messageController.getThreads));
router.post("/threads", asyncHandler(messageController.createThread));
router.get("/threads/:id/messages", asyncHandler(messageController.getMessages));
router.post("/threads/:id/messages", asyncHandler(messageController.sendMessage));

module.exports = router;
