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
const authRouter = require("./auth");

const adminRoute = express.Router();

adminRoute.get("/users", authenticate, adminAuth, async (req, res) => {
  try {
    const data = await User.find().select("-password");

    res.status(200).json({ message: "data fetched successfull", data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

adminRoute.get("/user/:userId", authenticate, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("-password");

    res.status(200).json({
      success: true,
      message: "fetched user successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update user details",
    });
  }
});

adminRoute.post("/user", authenticate, adminAuth, async (req, res) => {
  try {
    signupDataValidation(req);

    const newUser = await createUser(req);
    res.status(200).json({ message: "User Created succesfully", newUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

adminRoute.patch(
  "/user/:id",
  authenticate,
  adminAuth,
  upload.single("profileImage"),
  async (req, res) => {
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
      console.error(error);

      res.status(400).json({
        success: false,
        message: error.message || "Failed to update user details",
      });
    }
  },
);

adminRoute.delete("/user/:id", authenticate, adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(200).json(
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update user details",
      }),
    );
  }
});

module.exports = adminRoute;
