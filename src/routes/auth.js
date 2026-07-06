const express = require('express');

const User = require("../models/User");
const { signupDataValidation } = require("../utils/validation");
const sendToken = require("../utils/sendToken");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    signupDataValidation(req);
    const { username, email } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error("Email alreay exist");
      }

      if (existingUser.username === username) {
        throw new Error("Username already exist");
      }
    }

    const newUser = new User(req.body);
    await newUser.save();
    sendToken(newUser, res);
  } catch (err) {
    console.log(err.message);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.comparePassword(password)) {
      throw new Error("Invalid Credentials");
    }

    sendToken(user, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

authRouter.post("/logout", (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.status(200).json({ message: "Logout Successful" });
});

module.exports = authRouter;