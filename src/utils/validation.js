const validator = require("validator");

const signupDataValidation = (req) => {
  const requiredFields = ["username", "email", "password"];
  const signupData = req.body;

  const isValidFields = Object.keys(signupData).every((key) =>
    requiredFields.includes(key),
  );

  if (!isValidFields) {
    throw new Error("Invalid fields in request");
  }

  const { password } = signupData;
  if (!validator.isStrongPassword(password)) {
    throw new Error(
      "Password must be at least 6 characters long and include uppercase letters, lowercase letters, numbers, and symbols",
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
    throw new Error("Invalid fields in request");
  }

  if (!postsData.content?.trim()) {
    throw new Error("Content is required");
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
    throw new Error("Invalid profile update fields");
  }

  return true;
};

module.exports = {
  validateProfileUpdates,
  signupDataValidation,
  postsDataValidation,
};
