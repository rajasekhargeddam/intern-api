const jwt = require("jsonwebtoken");
const Connection = require("../models/Connection");

const sanitizeUser = async (user) => {
  const { password, ...sanitizedUser } = user.toObject();
  const connectionsCount = await Connection.countDocuments({
    status: "accepted",
    $or: [
      { sender: user._id },
      { receiver: user._id },
    ],
  });
  sanitizedUser.connectionsCount = connectionsCount;
  return sanitizedUser;
};

const sendToken = async (user, res) => {
  const token = user.getJWT();

  res.cookie("token", token, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return res.status(201).json({
    message: "Authentication successful",
    success: true,
    user: await sanitizeUser(user),
  });
};

module.exports = sendToken;
