const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Service title is required."],
      trim: true,
      maxlength: 100,
    },

    category: {
      type: String,
      required: [true, "Service category is required."],
      trim: true,
    },

    description: {
      type: String,
      required: [true, "Service description is required."],
      trim: true,
      maxlength: 2000,
    },

    price: {
      type: Number,
      required: [true, "Service price is required."],
      min: [0, "Price cannot be negative."],
    },

    location: {
      type: String,
      required: [true, "Service location is required."],
      trim: true,
      maxlength: 150,
    },

    image: {
      type: String,
      default: "",
      trim: true,
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

module.exports = mongoose.model("Service", serviceSchema);
