const express = require("express");

const authenticate = require("../middleware/authenticate");
const upload = require("../middleware/upload");
const { validateProfileUpdates } = require("../utils/validation");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const User = require("../models/User");

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
  async (req, res) => {
    try {
      validateProfileUpdates(req.body);

      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const { firstname, lastname, bio, gender, removeProfileImage } = req.body;

      if (firstname !== undefined) {
        user.firstname = firstname.trim();
      }

      if (lastname !== undefined) {
        user.lastname = lastname.trim();
      }

      if (bio !== undefined) {
        user.bio = bio.trim();
      }

      if (gender !== undefined) {
        user.gender = gender;
      }

      if (removeProfileImage === "true") {
        user.profilePicture = "";
      }

      if (req.file) {
        const uploadResult = await uploadToCloudinary(req.file.buffer);

        user.profilePicture = uploadResult.secure_url;
      }

      await user.save();

      const userDetails = user.toObject();

      delete userDetails.password;

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: userDetails,
      });
    } catch (error) {
      console.error(error);

      res.status(400).json({
        success: false,
        message: error.message || "Failed to update profile",
      });
    }
  },
);

module.exports = profileRouter;
