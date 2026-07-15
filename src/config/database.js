const mongoose = require("mongoose");
const dotenv = require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected succesfully....");
  } catch (err) {
    console.log("Database connection failed!");
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;
