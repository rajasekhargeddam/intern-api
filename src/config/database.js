const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const dns = require("dns");

dns.setServers(["1.1.1.1", "8.8.8.8"]);

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
