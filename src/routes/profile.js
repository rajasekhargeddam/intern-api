const express = require("express");

const authenticate = require("../middleware/authenticate");
const upload = require("../middleware/upload");
const { validateProfileUpdates } = require("../utils/validation");
const updateUser = require("../utils/updateUser");
const Like = require("../models/Like");

const profileRouter = express.Router();

profileRouter.get("/me", authenticate, (req, res) => {
  const { user } = req;
  const { password, ...userDetails } = user;
  res.status(200).json({
    success: true,
    user: userDetails,
  });
});

profileRouter.patch(
  "/edit",
  authenticate,
  upload.single("profileImage"),
  async (req, res, next) => {
    try {
      validateProfileUpdates(req.body);

      const userDetails = await updateUser(req, req.user._id);
      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: userDetails,
      });
    } catch (error) {
      next(error);
    }
  },
);

profileRouter.get("/likes", authenticate, async (req, res, next) => {
  try {
    const likes = await Like.find({ user: req.user._id })
      .populate({
        path: "post",
        select:
          "author content images hashtags links likesCount commentsCount createdAt",
        populate: {
          path: "author",
          select: "username profilePicture",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    const posts = likes
      .map((like) => like.post)
      .filter(Boolean) // in case a liked post was deleted
      .map((post) => ({
        ...post,
        isLiked: true,
      }));

    console.log(posts);

    return res.status(200).json({
      success: true,
      posts,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = profileRouter;
