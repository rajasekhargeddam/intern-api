const mongoose = require("mongoose");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv").config();

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  lastname: {
    type: String,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Invalid email formate..");
      }
    },
  },
  profilePicture: {
    type: String,
    trim: true,
    default:
      "https://static.vecteezy.com/system/resources/thumbnails/067/451/114/small/avatar-default-user-profile-icon-gender-neutral-silhouette-simple-flat-profile-picture-symbol-user-account-dp-sign-best-for-social-media-icons-web-and-app-design-illustration-vector.jpg",
    validate(value) {
      if (!validator.isURL) {
        throw new Error("Invalid profile URL");
      }
    },
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  gender: {
    type: String,
    trim: true,
    enum: {
      values: ["male", "female", "others"],
      message: "invalid gender type",
    },
  },
  age: {
    type: Number,
    min: 14,
    max: 150,
  },
  role: {
    type: String,
    enum: {
      values: ["user", "admin"],
      message: "Invalid Role",
    },
    default: "user",
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6,
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.getJWT = function () {
  const user = this;
  const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
  return jwtToken;
};

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
