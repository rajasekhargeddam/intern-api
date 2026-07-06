const jwt = require("jsonwebtoken");
const User = require("../models/User");
const dotenv = require("dotenv").config();

const authUser = async (req, res, next) => {
  const { token } = req.cookies;
  try {
    if (!token) {
      throw new Error("Token Not Found");
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decode.id);
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = authUser;
