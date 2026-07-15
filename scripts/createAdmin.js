const mongoose = require("mongoose");
const dotenv = require("dotenv");

const User = require("../src/models/User");

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Database connected");

    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL,
    });

    if (existingAdmin) {
      console.log("Admin already exists");

      await mongoose.disconnect();
      return;
    }

    await User.create({
      username: process.env.ADMIN_USERNAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: "admin",
    });

    console.log("Admin created successfully");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Failed to create admin:", error);

    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();