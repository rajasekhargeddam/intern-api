const User = require("../models/User");
const AppError = require("./AppError");
const uploadToCloudinary = require("./uploadToCloudinary");

const updateUser = async (req, userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.role === "admin") {
    throw new AppError("Unauthorized admin request", 403);
  }

  const { firstname, lastname, bio, gender, removeProfileImage } = req.body;

  if (firstname !== undefined) {
    user.firstname = firstname.trim();
  }

  if (lastname !== undefined) {
    user.lastname = lastname.trim();
  }

  if (bio !== undefined) {
    user.bio = bio.trim();
  }

  if (gender !== undefined) {
    user.gender = gender;
  }

  if (removeProfileImage === "true") {
    user.profilePicture = "";
  }

  if (req.file) {
    const uploadResult = await uploadToCloudinary(req.file.buffer);

    user.profilePicture = uploadResult.secure_url;
  }

  await user.save();

  const userDetails = user.toObject();

  delete userDetails.password;

  return userDetails;
};

module.exports = updateUser;
