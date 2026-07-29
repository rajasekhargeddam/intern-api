const express = require("express");
const mongoose = require("mongoose");

const Comment = require("../models/Comment");
const Post = require("../models/Post");
const AppError = require("../utils/AppError");
const authenticate = require("../middleware/authenticate");

const commentRouter = express.Router();

commentRouter.post("/:postId", authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      throw new AppError("Post not found", 404);
    }

    const comment = await Comment.create({
      post: postId,
      user: req.user._id,
      content,
    });

    await Post.findByIdAndUpdate(postId, {
      $inc: {
        commentsCount: 1,
      },
    });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    next(error);
  }
});

commentRouter.post(
  "/:postId/:commentId/replies",
  authenticate,
  async (req, res, next) => {
    try {
      const { postId, commentId } = req.params;
      const { content } = req.body;

      const [post, parentComment] = await Promise.all([
        Post.findById(postId),
        Comment.findById(commentId),
      ]);

      if (!post) {
        throw new AppError("Post not found", 404);
      }

      if (!parentComment) {
        throw new AppError("Parent comment not found", 404);
      }

      if (!parentComment.post.equals(post._id)) {
        throw new AppError("Parent comment does not belong to this post", 400);
      }

      const reply = await Comment.create({
        post: postId,
        user: req.user._id,
        content,
        parentComment: commentId,
      });

      console.log("replay created successfull");

      res.status(201).json({
        success: true,
        message: "Reply added successfully",
        comment: reply,
      });
    } catch (error) {
      next(error);
    }
  },
);

commentRouter.get("/:postId", authenticate, async (req, res, next) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.aggregate([
      {
        $match: {
          post: new mongoose.Types.ObjectId(postId),
          parentComment: null,
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
          localField: "user",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                username: 1,
                profilePicture: 1,
              },
            },
          ],
          as: "user",
        },
      },

      {
        $unwind: "$user",
      },

      {
        $lookup: {
          from: "comments",
          let: {
            commentId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$parentComment", "$$commentId"],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "replyData",
        },
      },

      {
        $addFields: {
          replyCount: {
            $ifNull: [
              {
                $first: "$replyData.count",
              },
              0,
            ],
          },
        },
      },

      {
        $project: {
          replyData: 0,
        },
      },
    ]);

    res.status(200).json({
      success: true,
      comments,
    });
  } catch (error) {
    next(error);
  }
});

commentRouter.get(
  "/replies/:commentId",
  authenticate,
  async (req, res, next) => {
    try {
      const { commentId } = req.params;

      const replies = await Comment.aggregate([
        {
          $match: {
            parentComment: new mongoose.Types.ObjectId(commentId),
          },
        },
        {
          $sort: {
            createdAt: 1,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "user",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  username: 1,
                  profilePicture: 1,
                },
              },
            ],
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "parentComment",
            as: "replies",
          },
        },
        {
          $addFields: {
            replyCount: {
              $size: "$replies",
            },
          },
        },
        {
          $project: {
            replies: 0,
          },
        },
      ]);

      res.status(200).json({
        success: true,
        replies,
      });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = commentRouter;
