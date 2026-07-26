const express = require("express");
const authenticate = require("../middleware/authenticate");
const User = require("../models/User");
const adminAuth = require("../middleware/adminAuth");
const {
  signupDataValidation,
  validateProfileUpdates,
} = require("../utils/validation");
const upload = require("../middleware/upload");
const createUser = require("../utils/createUser");
const updateUser = require("../utils/updateUser");
const AppError = require("../utils/AppError");

const adminRoute = express.Router();

adminRoute.get("/users", authenticate, adminAuth, async (req, res, next) => {
  try {
    const userId = req.user._id;
    const data = await User.find({ _id: { $ne: userId } })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, message: "Data fetched successfully", data });
  } catch (err) {
    next(err);
  }
});

adminRoute.get("/user/:userId", authenticate, adminAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "Fetched user successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
});

adminRoute.post("/user", authenticate, adminAuth, async (req, res, next) => {
  try {
    signupDataValidation(req);

    const newUser = await createUser(req);
    res.status(201).json({ success: true, message: "User created successfully", newUser });
  } catch (err) {
    next(err);
  }
});

adminRoute.patch(
  "/user/:id",
  authenticate,
  adminAuth,
  upload.single("profileImage"),
  async (req, res, next) => {
    try {
      validateProfileUpdates(req.body);
      const userId = req.params.id;
      const userDetails = await updateUser(req, userId);

      res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: userDetails,
      });
    } catch (error) {
      next(error);
    }
  },
);

adminRoute.delete("/user/:id", authenticate, adminAuth, async (req, res, next) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      new AppError("User not found", 404);
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = adminRoute;
