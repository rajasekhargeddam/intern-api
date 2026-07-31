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

postRouter.patch(
  "/:postId",
  authenticate,
  upload.none(),
  async (req, res, next) => {
    try {
      postsDataValidation(req);
      console.log("api call");
      const { postId } = req.params;
      const { content } = req.body;

      const hashtags = (content.match(/#\w+/g) || []).map((tag) =>
        tag.substring(1).toLowerCase(),
      );

      const links = content.match(/https?:\/\/[^\s]+/g) || [];

      const post = await Post.findOneAndUpdate(
        {
          _id: postId,
          author: req.user._id, // only owner can edit
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

    const posts = await Post.aggregate([
      {
        $sort: { createdAt: -1 },
      },

      {
        $skip: offset,
      },

      {
        $limit: limit + 1, // fetch one extra post to know if more exist
      },

      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                username: 1,
                profilePicture: 1,
              },
            },
          ],
          as: "author",
        },
      },

      {
        $unwind: "$author",
      },

      {
        $lookup: {
          from: "likes",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                users: { $push: "$user" },
              },
            },
          ],
          as: "likesData",
        },
      },

      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "commentsData",
        },
      },

      {
        $addFields: {
          likesCount: {
            $ifNull: [
              {
                $first: "$likesData.count",
              },
              0,
            ],
          },

          commentsCount: {
            $ifNull: [
              {
                $first: "$commentsData.count",
              },
              0,
            ],
          },

          isLiked: {
            $in: [
              req.user._id,
              {
                $ifNull: [
                  {
                    $first: "$likesData.users",
                  },
                  [],
                ],
              },
            ],
          },
        },
      },

      {
        $project: {
          likesData: 0,
          commentsData: 0,
        },
      },
    ]);

    const hasMore = posts.length > limit;

    if (hasMore) {
      posts.pop();
    }

    res.status(200).json({
      success: true,
      posts,
      hasMore,
      nextOffset: offset + posts.length,
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
        $skip: offset,
      },

      {
        $limit: limit + 1,
      },

      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                username: 1,
                profilePicture: 1,
              },
            },
          ],
          as: "author",
        },
      },

      {
        $unwind: "$author",
      },

      {
        $lookup: {
          from: "likes",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                users: { $push: "$user" },
              },
            },
          ],
          as: "likesData",
        },
      },

      {
        $lookup: {
          from: "comments",
          let: { postId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "commentsData",
        },
      },

      {
        $addFields: {
          likesCount: {
            $ifNull: [
              {
                $first: "$likesData.count",
              },
              0,
            ],
          },

          commentsCount: {
            $ifNull: [
              {
                $first: "$commentsData.count",
              },
              0,
            ],
          },

          isLiked: {
            $in: [
              req.user._id,
              {
                $ifNull: [
                  {
                    $first: "$likesData.users",
                  },
                  [],
                ],
              },
            ],
          },
        },
      },

      {
        $project: {
          likesData: 0,
          commentsData: 0,
        },
      },
    ]);

    const hasMore = posts.length > limit;

    if (hasMore) {
      posts.pop();
    }

    res.status(200).json({
      success: true,
      posts,
      hasMore,
      nextOffset: offset + posts.length,
    });
  } catch (error) {
    next(error);
  }
});

postRouter.get("/details/:postId", authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new Error("Inavlid Id Type", 403);
    }

    const post = await Post.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(postId),
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                username: 1,
                profilePicture: 1,
              },
            },
          ],
          as: "author",
        },
      },

      {
        $unwind: "$author",
      },

      {
        $lookup: {
          from: "likes",
          let: {
            postId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            {
              $group: {
                _id: null,
                count: {
                  $sum: 1,
                },
                users: {
                  $push: "$user",
                },
              },
            },
          ],
          as: "likesData",
        },
      },

      {
        $lookup: {
          from: "comments",
          let: {
            postId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$post", "$$postId"],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "commentsData",
        },
      },

      {
        $addFields: {
          likesCount: {
            $ifNull: [
              {
                $first: "$likesData.count",
              },
              0,
            ],
          },

          commentsCount: {
            $ifNull: [
              {
                $first: "$commentsData.count",
              },
              0,
            ],
          },

          isLiked: {
            $in: [
              req.user._id,
              {
                $ifNull: [
                  {
                    $first: "$likesData.users",
                  },
                  [],
                ],
              },
            ],
          },
        },
      },

      {
        $project: {
          likesData: 0,
          commentsData: 0,
        },
      },
    ]);

    const postDetails = post[0];

    if (!postDetails) {
      throw new AppError("Post not found", 404);
    }

    res.status(200).json({
      success: true,
      post: postDetails,
    });
  } catch (error) {
    console.log(error);
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

module.exports = postRouter;
