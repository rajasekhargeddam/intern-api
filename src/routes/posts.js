const express = require("express");

const Post = require("../models/Post");
const authenticate = require("../middleware/authenticate");
const { postsDataValidation } = require("../utils/validation");

const postRouter = express.Router();

postRouter.post("/", authenticate, async (req, res) => {
  try {
    postsDataValidation(req);
    // Process the valid post data
    const { content, images } = req.body;
    const author = req.user._id;

    const hashtags = (content.match(/#\w+/g) || []).map((tag) =>
      tag.substring(1),
    );
    const links = content.match(/https?:\/\/[^\s]+/g) || [];

    const newPost = {
      author,
      content,
      images,
      hashtags,
      links,
    };

    const post = new Post(newPost);
    await post.save();

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

postRouter.get("/", authenticate, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username email")
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = postRouter;
