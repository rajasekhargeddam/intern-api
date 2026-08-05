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
    secure: false,     // MUST be false since you are using HTTP (54.206.126.238)
    sameSite: 'lax',   // Use 'lax' for standard HTTP deployment on same domain/IP
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days (or your preferred expiration)
  });

  return res.status(201).json({
    message: "Authentication successful",
    success: true,
    user: await sanitizeUser(user),
  });
};

module.exports = sendToken;
