const express = require("express");
const mongoose = require("mongoose");

const Post = require("../models/Post");
const authenticate = require("../middleware/authenticate");
const { postsDataValidation } = require("../utils/validation");
const upload = require("../middleware/upload");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const AppError = require("../utils/AppError");
const Like = require("../models/Like");

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
    const posts = await Post.aggregate([
      {
        $sort: { createdAt: -1 },
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post",
          as: "likes",
        },
      },
      {
        $project: {
          content: 1,
          images: 1,
          hashtags: 1,
          links: 1,
          createdAt: 1,
          updatedAt: 1,

          author: {
            _id: "$author._id",
            firstname: "$author.firstname",
            lastname: "$author.lastname",
            username: "$author.username",
            email: "$author.email",
            profilePicture: "$author.profilePicture",
            bio: "$author.bio",
            gender: "$author.gender",
            age: "$author.age",
            role: "$author.role",
          },

          likesCount: {
            $size: "$likes",
          },
          isLiked: {
            $in: [new mongoose.Types.ObjectId(req.user._id), "$likes.user"],
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    next(error);
  }
});

postRouter.get("/:userId", authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const posts = await Post.aggregate([
      {
        $match: {
          author: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $unwind: "$author",
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post",
          as: "likes",
        },
      },
      {
        $project: {
          content: 1,
          images: 1,
          hashtags: 1,
          links: 1,
          createdAt: 1,
          updatedAt: 1,

          author: {
            _id: "$author._id",
            firstname: "$author.firstname",
            lastname: "$author.lastname",
            username: "$author.username",
            email: "$author.email",
            profilePicture: "$author.profilePicture",
            bio: "$author.bio",
            gender: "$author.gender",
            age: "$author.age",
            role: "$author.role",
          },

          likesCount: {
            $size: "$likes",
          },
          isLiked: {
            $in: [new mongoose.Types.ObjectId(req.user._id), "$likes.user"],
          },
        },
      },
    ]);
    res.status(200).json({
      success: true,
      posts,
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
      throw new AppError("Post Not Found", 403);
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

    res
      .status(200)
      .json({ success: true, message: "Post deleted successfull" });
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
      throw new AppError("Post Not Found", 403);
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

// postRouter.get("/:postId/likes", authenticate, async (req, res, next) => {
//   try {
//     const { postId } = req.params;
//     const { _id: userId } = req.user;

//     const post = await Post.findById(postId);

//     if (!post) {
//       return res.status(404).json({
//         success: false,
//         message: "Post not found.",
//       });
//     }

//     const [likesCount, existingLike] = await Promise.all([
//       Like.countDocuments({ post: postId }),
//       Like.findOne({ post: postId, user: userId }),
//     ]);

//     return res.status(200).json({
//       success: true,
//       likesCount,
//       liked: !!existingLike,
//     });
//   } catch (err) {
//     next(err);
//   }
// });

module.exports = postRouter;
