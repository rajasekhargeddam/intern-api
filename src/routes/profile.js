const express = require("express");

const authenticate = require("../middleware/authenticate");
const upload = require("../middleware/upload");
const { validateProfileUpdates } = require("../utils/validation");
const updateUser = require("../utils/updateUser");

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

module.exports = profileRouter;
