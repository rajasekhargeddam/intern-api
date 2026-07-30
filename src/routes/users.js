const express = require("express");
const authenticate = require("../middleware/authenticate");
const { default: mongoose } = require("mongoose");
const User = require("../models/User");
const userRouter = express.Router();

userRouter.get("/:userId", authenticate, async (req, res, next) => {
  try {
    const loggedInUserId = new mongoose.Types.ObjectId(req.user._id);
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const user = await User.aggregate([
      {
        $match: {
          _id: userId,
        },
      },

      // Count accepted connections
      {
        $lookup: {
          from: "connections",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$status", "accepted"] },
                    {
                      $or: [
                        { $eq: ["$sender", "$$userId"] },
                        { $eq: ["$receiver", "$$userId"] },
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "connections",
        },
      },

      // Get relationship between logged-in user and profile user
      {
        $lookup: {
          from: "connections",
          let: {
            profileUserId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    {
                      $and: [
                        { $eq: ["$sender", "$$profileUserId"] },
                        { $eq: ["$receiver", loggedInUserId] },
                      ],
                    },
                    {
                      $and: [
                        { $eq: ["$receiver", "$$profileUserId"] },
                        { $eq: ["$sender", loggedInUserId] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $limit: 1,
            },
          ],
          as: "relation",
        },
      },

      {
        $addFields: {
          connectionsCount: {
            $size: "$connections",
          },

          relationship: {
            status: {
              $switch: {
                branches: [
                  {
                    case: {
                      $and: [
                        { $gt: [{ $size: "$relation" }, 0] },
                        {
                          $eq: [
                            { $arrayElemAt: ["$relation.status", 0] },
                            "accepted",
                          ],
                        },
                      ],
                    },
                    then: "connected",
                  },
                  {
                    case: {
                      $and: [
                        { $gt: [{ $size: "$relation" }, 0] },
                        {
                          $eq: [
                            { $arrayElemAt: ["$relation.status", 0] },
                            "pending",
                          ],
                        },
                        {
                          $eq: [
                            { $arrayElemAt: ["$relation.sender", 0] },
                            loggedInUserId,
                          ],
                        },
                      ],
                    },
                    then: "pending_sent",
                  },
                  {
                    case: {
                      $and: [
                        { $gt: [{ $size: "$relation" }, 0] },
                        {
                          $eq: [
                            { $arrayElemAt: ["$relation.status", 0] },
                            "pending",
                          ],
                        },
                      ],
                    },
                    then: "pending_received",
                  },
                ],
                default: "none",
              },
            },

            requestId: {
              $ifNull: [
                {
                  $arrayElemAt: ["$relation._id", 0],
                },
                null,
              ],
            },
          },
        },
      },

      {
        $project: {
          firstname: 1,
          lastname: 1,
          username: 1,
          email: 1,
          profilePicture: 1,
          bio: 1,
          gender: 1,
          age: 1,
          createdAt: 1,
          updatedAt: 1,

          connectionsCount: 1,
          relationship: 1,
        },
      },
    ]);

    if (!user.length) {
      throw new Error("User not found.", 404);
    }

    res.status(200).json({
      success: true,
      user: user[0],
    });
  } catch (error) {
    next(error);
  }
});

module.exports = userRouter;
