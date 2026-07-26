const User = require("../models/User");
const AppError = require("./AppError");

const createUser = async (req) => {
  const { username, email } = req.body;
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new AppError("Email already exists", 400);
    }

    if (existingUser.username === username) {
      throw new AppError("Username already exists", 400);
    }
  }

  const newUser = new User(req.body);
  await newUser.save();
  return newUser;
};

module.exports = createUser;
