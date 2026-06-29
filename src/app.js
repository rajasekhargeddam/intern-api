const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const connectDB = require("./config/database");
const User = require("./models/User");
const { signupDataValidation } = require("./utils/validation");
const sendToken = require("./utils/sendToken");
const authUser = require("./middleware/authUser");
const dotenv = require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: ["http://localhost:5173", "https://intern-nine-sable.vercel.app/"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.post("/signup", async (req, res) => {
  try {
    signupDataValidation(req);
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
    sendToken(newUser, res);
  } catch (err) {
    console.log(err.message);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.comparePassword(password)) {
      throw new Error("Invalid Credentials");
    }

    sendToken(user, res);
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
});

app.post("/logout", (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.status(200).json({ message: "Logout Successful" });
});

app.get("/profile", authUser, (req, res) => {
  const { user } = req;
  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("server is running at http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
  });
