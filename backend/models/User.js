const mongoose = require("mongoose");

const providerProfileSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      trim: true,
      default: "",
    },

    experience: {
      type: String,
      trim: true,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    phone: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },

    role: {
      type: String,
      enum: ["customer", "provider", "admin"],
      default: "customer",
      required: true,
    },

    providerProfile: {
      type: providerProfileSchema,
      default: () => ({}),
    },

    providerStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
