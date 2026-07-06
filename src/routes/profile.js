const express = require("express");

const authUser = require("../middleware/authUser");

const profileRouter = express.Router();

profileRouter.get("/me", authUser, (req, res) => {
  const { user } = req;
  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

module.exports = profileRouter;