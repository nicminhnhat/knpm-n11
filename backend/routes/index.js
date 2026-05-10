const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const profileRoutes = require("./profile.routes");
const roomRoutes = require("./room.routes");
const postRoutes = require("./post.routes");
const landlordRoutes = require("./landlord.routes");
const adminRoutes = require("./admin.routes");
const messageRoutes = require("./message.routes");
const interactionRoutes = require("./interaction.routes");

router.use("/auth", authRoutes);
router.use("/profile", profileRoutes);
router.use("/rooms", roomRoutes);
router.use("/posts", postRoutes);
router.use("/landlord", landlordRoutes);
router.use("/admin", adminRoutes);
router.use("/messages", messageRoutes);
router.use("/", interactionRoutes); // Interactions includes /reports, /favorites, /my/reports, /notifications

module.exports = router;
