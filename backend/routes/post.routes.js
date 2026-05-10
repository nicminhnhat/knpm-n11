const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const { asyncHandler } = require("../utils/helpers");

router.get("/", asyncHandler(postController.getPosts));
router.get("/:id", asyncHandler(postController.getPostById));

module.exports = router;
