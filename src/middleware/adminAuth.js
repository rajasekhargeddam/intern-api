const adminAuth = (req, res, next) => {
  if (req.user.role !== "admin") {
    res.status(400).json({ message: "anotherized admin request" });
  }
  next();
};

module.exports = adminAuth;
