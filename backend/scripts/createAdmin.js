require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);

    console.log("MongoDB connected");

    // Admin credentials
    const adminName = "ServiceHub Admin";
    const adminEmail = "admin@servicehub.com";
    const adminPassword = "Admin@12345";

    // Check whether admin already exists
    const existingAdmin = await User.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      console.log("Admin account already exists.");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin account
    await User.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("Admin account created successfully!");
    console.log("Email:", adminEmail);
    console.log("Password:", adminPassword);
  } catch (error) {
    console.error("Admin creation failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

createAdmin();
