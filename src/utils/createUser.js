const User = require("../models/User");


const createUser = async (req) => {
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
  return newUser;
};

module.exports = createUser;
