const express = require("express");
const router = express.Router();
const roomController = require("../controllers/room.controller");
const { asyncHandler } = require("../utils/helpers");

router.get("/", asyncHandler(roomController.getRooms));
router.get("/:id", asyncHandler(roomController.getRoomById));

module.exports = router;
