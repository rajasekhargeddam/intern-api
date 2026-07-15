const express = require("express");
const authenticate = require("../middleware/authenticate");
const User = require("../models/User");
const adminAuth = require("../middleware/adminAuth");

const adminRoute = express.Router();

adminRoute.get("/users", authenticate, adminAuth, async (req, res) => {
  try {
    const data = await User.find().select("-password");

    res.status(200).json({ message: "data fetched successfull", data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = adminRoute;
