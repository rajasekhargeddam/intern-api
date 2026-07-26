const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const dotenv = require("dotenv").config();

const authenticate = async (req, res, next) => {
  const { token } = req.cookies;
  try {
    if (!token) {
      return next(new AppError("Token Not Found", 401));
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decode.id).lean();
    if (!user) {
      return next(new AppError("User not found. Please log in again.", 401));
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new AppError("Invalid or expired token", 401));
    }

    next(err);
  }
};

module.exports = authenticate;
