const express = require("express");
const mongoose = require("mongoose");

const Post = require("../models/Post");
const Like = require("../models/Like");
const authenticate = require("../middleware/authenticate");
const upload = require("../middleware/upload");
const AppError = require("../utils/AppError");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const { postsDataValidation } = require("../utils/validation");
const {
  buildPostAggregation,
  buildPaginationMeta,
} = require("../utils/postAggregation");

const postRouter = express.Router();

const extractPostMetadata = (content = "") => {
  const hashtags = (content.match(/#\w+/g) || []).map((tag) =>
    tag.substring(1).toLowerCase(),
  );

  const links = content.match(/https?:\/\/[^\s]+/g) || [];

  return { hashtags, links };
};

postRouter.post(
  "/",
  authenticate,
  upload.array("images", 4),
  async (req, res, next) => {
    try {
      postsDataValidation(req);

      const { content } = req.body;
      const author = req.user._id;
      const { hashtags, links } = extractPostMetadata(content);

      let images = [];

      if (req.files?.length) {
        images = await Promise.all(
          req.files.map(async (file) => {
            const result = await uploadToCloudinary(file.buffer, "post-images");

            return result.secure_url;
          }),
        );
      }

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

postRouter.patch(
  "/:postId",
  authenticate,
  upload.none(),
  async (req, res, next) => {
    try {
      postsDataValidation(req);

      const { postId } = req.params;
      const { content } = req.body;
      const { hashtags, links } = extractPostMetadata(content);

      const post = await Post.findOneAndUpdate(
        {
          _id: postId,
          author: req.user._id,
        },
        {
          content,
          hashtags,
          links,
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!post) {
        throw new AppError("Post not found", 404);
      }

      res.status(200).json({
        success: true,
        message: "Post updated successfully",
        post,
      });
    } catch (error) {
      next(error);
    }
  },
);

postRouter.get("/", authenticate, async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;

    const posts = await Post.aggregate(
      buildPostAggregation({
        userId: req.user._id,
        limit,
        offset,
      }),
    );

    const pagination = buildPaginationMeta(posts, limit, offset);

    res.status(200).json({
      success: true,
      ...pagination,
    });
  } catch (error) {
    next(error);
  }
});

postRouter.get("/details/:postId", authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new AppError("Invalid Id Type", 400);
    }

    const post = await Post.aggregate(
      buildPostAggregation({
        matchStage: {
          _id: new mongoose.Types.ObjectId(postId),
        },
        userId: req.user._id,
        includePagination: false,
      }),
    );

    const postDetails = post[0];

    if (!postDetails) {
      throw new AppError("Post not found", 404);
    }

    res.status(200).json({
      success: true,
      post: postDetails,
    });
  } catch (error) {
    next(error);
  }
});

postRouter.get("/:userId", authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const limit = Number(req.query.limit) || 10;
    const offset = Number(req.query.offset) || 0;

    const posts = await Post.aggregate(
      buildPostAggregation({
        matchStage: {
          author: new mongoose.Types.ObjectId(userId),
        },
        userId: req.user._id,
        limit,
        offset,
      }),
    );

    const pagination = buildPaginationMeta(posts, limit, offset);

    res.status(200).json({
      success: true,
      ...pagination,
    });
  } catch (error) {
    next(error);
  }
});

postRouter.delete("/:postId", authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId).populate("author", "role");

    if (!post) {
      throw new AppError("Post Not Found", 404);
    }

    const isOwner = post.author._id.toString() === req.user._id.toString();
    const isAdminDeletingUser =
      req.user.role === "admin" && post.author.role === "user";

    if (!isOwner && !isAdminDeletingUser) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

postRouter.post("/:postId/like", authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { _id: userId } = req.user;

    const post = await Post.findById(postId);

    if (!post) {
      throw new AppError("Post Not Found", 404);
    }

    const existingLike = await Like.findOne({
      user: userId,
      post: postId,
    });

    let liked;

    if (existingLike) {
      await existingLike.deleteOne();
      liked = false;
    } else {
      await Like.create({
        user: userId,
        post: postId,
      });
      liked = true;
    }

    return res.status(200).json({
      success: true,
      liked,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = postRouter;
