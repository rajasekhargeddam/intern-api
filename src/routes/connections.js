const express = require("express");
const authenticate = require("../middleware/authenticate");
const Connection = require("../models/Connection");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const connectionRouter = express.Router();

connectionRouter.get("/requests", authenticate, async (req, res, next) => {
  try {
    const requests = await Connection.find({
      receiver: req.user._id,
      status: "pending",
    }).populate("sender", "firstname lastname username profilePicture");

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

connectionRouter.get("/:userId", authenticate, async (req, res, next) => {
  try {
    // GET /connections
    const { userId } = req.params;

    const connections = await Connection.find({
      status: "accepted",
      $or: [{ sender: userId }, { receiver: userId }],
    })
      .populate("sender", "username firstname lastname profilePicture")
      .populate("receiver", "username firstname lastname  profilePicture");

    const users = connections.map((connection) =>
    ({
      _id: connection._id, user: connection.sender._id.equals(userId)
        ? connection.receiver
        : connection.sender
    })
    );

    res.status(200).json({
      success: true,
      connections: users,
    });
  } catch (error) {
    next(error);
  }
});

connectionRouter.post(
  "/request/:receiverId",
  authenticate,
  async (req, res, next) => {
    try {
      const senderId = req.user._id;
      const receiverId = req.params.receiverId;

      if (senderId.equals(receiverId)) {
        throw new AppError(
          "You cannot send a connection request to yourself.",
          400,
        );
      }

      console.log(receiverId);
      const receiver = await User.findById(receiverId);

      if (!receiver) {
        throw new AppError("User not found.", 404);
      }

      const existingConnection = await Connection.findOne({
        $or: [
          {
            sender: senderId,
            receiver: receiverId,
          },
          {
            sender: receiverId,
            receiver: senderId,
          },
        ],
      });

      if (existingConnection) {
        throw new AppError("Connection already exists.", 400);
      }

      await Connection.create({
        sender: senderId,
        receiver: receiverId,
      });

      res.status(201).json({
        success: true,
        message: "Connection request sent.",
      });
    } catch (error) {
      next(error);
    }
  },
);

connectionRouter.patch(
  "/:connectionId/accept",
  authenticate,
  async (req, res, next) => {
    try {
      const connection = await Connection.findById(req.params.connectionId);

      if (!connection) {
        throw new AppError("Connection request not found.", 404);
      }

      if (!connection.receiver.equals(req.user._id)) {
        throw new AppError("Unauthorized.", 403);
      }

      if (connection.status === "accepted") {
        throw new AppError("Already connected.", 400);
      }

      connection.status = "accepted";

      await connection.save();

      res.json({
        success: true,
        message: "Connection accepted.",
      });
    } catch (error) {
      next(error);
    }
  },
);

connectionRouter.delete(
  "/:connectionId",
  authenticate,
  async (req, res, next) => {
    try {
      const connection = await Connection.findById(req.params.connectionId);

      if (!connection) {
        throw new AppError("Connection request not found.", 404);
      }

      if (!connection.receiver.equals(req.user._id) && !connection.sender.equals(req.user._id)) {
        throw new Error("Unauthorized.", 400);
      }

      await connection.deleteOne();

      res.json({
        success: true,
        message: "Connection request rejected.",
      });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = connectionRouter;
