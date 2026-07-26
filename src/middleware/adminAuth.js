const AppError = require("../utils/AppError");

const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new AppError("Unauthorized admin request", 403));
  }
  next();
};

module.exports = adminAuth;
