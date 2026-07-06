const jwt = require("jsonwebtoken");

const sanitizeUser = (user) => {
  const { password, ...sanitizedUser } = user.toObject();
  return sanitizedUser;
};

const sendToken = async (user, res) => {
  const token = user.getJWT();

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return res.status(201).json({
    message: "Authentication successful",
    success: true,
    user: sanitizeUser(user),
  });
};

module.exports = sendToken;
