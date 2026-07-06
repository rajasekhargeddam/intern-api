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
  const requiredFields = ["author", "content", "images"];
  const postsData = req.body;

  const isValidFields = Object.keys(postsData).every((key) =>
    requiredFields.includes(key),
  );

  if (!isValidFields) {
    throw new Error("Invalid fields in request");
  }
};

module.exports = {
  signupDataValidation,
  postsDataValidation,
};
