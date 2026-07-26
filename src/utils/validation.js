const validator = require("validator");
const AppError = require("./AppError");

const signupDataValidation = (req) => {
  const requiredFields = ["username", "email", "password"];
  const signupData = req.body;

  const isValidFields = Object.keys(signupData).every((key) =>
    requiredFields.includes(key),
  );

  if (!isValidFields) {
    throw new AppError("Invalid fields in request", 400);
  }

  const { password } = signupData;
  if (!validator.isStrongPassword(password)) {
    throw new AppError(
      "Password must be at least 6 characters long and include uppercase letters, lowercase letters, numbers, and symbols",
      400,
    );
  }
};

const postsDataValidation = (req) => {
  const allowedFields = ["content"];

  const postsData = req.body;

  const isValidFields = Object.keys(postsData).every((key) =>
    allowedFields.includes(key)
  );

  if (!isValidFields) {
    throw new AppError("Invalid fields in request", 400);
  }

  if (!postsData.content?.trim()) {
    throw new AppError("Content is required", 400);
  }
};

const validateProfileUpdates = (updates) => {
  const allowedUpdates = [
    "firstname",
    "lastname",
    "bio",
    "gender",
    "removeProfileImage",
  ];

  const receivedUpdates = Object.keys(updates);

  const isValidUpdate = receivedUpdates.every((field) =>
    allowedUpdates.includes(field)
  );

  if (!isValidUpdate) {
    throw new AppError("Invalid profile update fields", 400);
  }

  return true;
};

module.exports = {
  validateProfileUpdates,
  signupDataValidation,
  postsDataValidation,
};
