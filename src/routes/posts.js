const express = require("express");

const Post = require("../models/Post");
const authenticate = require("../middleware/authenticate");
const { postsDataValidation } = require("../utils/validation");
const upload = require("../middleware/upload");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

const postRouter = express.Router();

postRouter.post(
  "/",
  authenticate,
  upload.array("images", 4),
  async (req, res, next) => {
    try {
      postsDataValidation(req);

      const { content } = req.body;
      const author = req.user._id;

      let images = [];

      if (req.files?.length) {
        images = await Promise.all(
          req.files.map(async (file) => {
            const result = await uploadToCloudinary(file.buffer, "post-images");

            return result.secure_url;
          }),
        );
      }

      const hashtags = (content.match(/#\w+/g) || []).map((tag) =>
        tag.substring(1),
      );

      const links = content.match(/https?:\/\/[^\s]+/g) || [];

      const post = await Post.create({
        author,
        content,
        images,
        hashtags,
        links,
      });

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        post,
      });
    } catch (error) {
      next(error);
    }
  },
);

postRouter.get("/", authenticate, async (req, res, next) => {
  try {
    const posts = await Post.find()
      .populate("author", "username email")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = postRouter;
