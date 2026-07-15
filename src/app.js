const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const connectDB = require("./config/database");
const dotenv = require("dotenv").config();
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const postRouter = require("./routes/posts");
const adminRoute = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://intern-nine-sable.vercel.app",
      "https://intern-bt4no3a4c-geddam-ganesh-rajasekhars-projects.vercel.app",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/posts", postRouter);
app.use("/admin", adminRoute);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("server is running at http://localhost:3000");
    });
  })
  .catch((err) => {
    console.error("Database cannot be connected!!");
  });
