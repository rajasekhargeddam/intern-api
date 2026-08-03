const express = require("express");

const User = require("../models/User");
const AppError = require("../utils/AppError");
const { signupDataValidation } = require("../utils/validation");
const sendToken = require("../utils/sendToken");
const createUser = require("../utils/createUser");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res, next) => {
  try {
    signupDataValidation(req);
    const newUser = await createUser(req);
    return sendToken(newUser, res);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError("Invalid Credentials", 401);
    }

    return sendToken(user, res);
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.status(200).json({ message: "Logout Successful" });
});

module.exports = authRouter;
