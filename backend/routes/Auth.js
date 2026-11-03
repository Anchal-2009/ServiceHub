const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      category,
      experience,
      location,
      description,
    } = req.body;

    // Validate required account fields
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    // Public registration only allows customers and providers
    if (role && !["customer", "provider"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Choose customer or provider.",
      });
    }

    const accountRole = role || "customer";
    const normalizedEmail = email.trim().toLowerCase();

    // Validate provider-specific fields
    if (accountRole === "provider") {
      if (
        typeof category !== "string" ||
        !category.trim() ||
        typeof experience !== "string" ||
        !experience.trim() ||
        typeof location !== "string" ||
        !location.trim() ||
        typeof description !== "string" ||
        !description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Category, experience, location, and description are required for providers.",
        });
      }

      const allowedCategories = [
        "Plumbing",
        "Electrical",
        "Cleaning",
        "AC Repair",
        "Carpentry",
        "Painting",
        "Beauty & Wellness",
        "Pest Control",
        "Appliance Repair",
        "Other",
      ];

      const allowedExperience = [
        "Less than 1 year",
        "1–3 years",
        "3–5 years",
        "5+ years",
      ];

      if (!allowedCategories.includes(category.trim())) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid service category.",
        });
      }

      if (!allowedExperience.includes(experience.trim())) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid experience level.",
        });
      }

      if (description.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Description cannot exceed 1000 characters.",
        });
      }
    }

    // Check for an existing account
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save provider details only for provider accounts
    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      phone: typeof phone === "string" ? phone.trim() : "",
      password: hashedPassword,
      role: accountRole,
    };

    if (accountRole === "provider") {
      userData.providerProfile = {
        category: category.trim(),
        experience: experience.trim(),
        location: location.trim(),
        description: description.trim(),
      };

      userData.providerStatus = "Pending";
    }

    const user = await User.create(userData);

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        ...(user.role === "provider" && {
          providerProfile: user.providerProfile,
        }),
      },
    });
  } catch (error) {
    // Handle duplicate email errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register account. Please try again.",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive. Please contact support.",
      });
    }

    if (user.role === "provider" && user.providerStatus !== "Approved") {
      return res.status(403).json({
        success: false,
        message:
          user.providerStatus === "Rejected"
            ? "Your provider application has been rejected. Please contact support."
            : "Your provider application is awaiting admin approval.",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        ...(user.role === "provider" && {
          providerProfile: user.providerProfile,
        }),
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in. Please try again.",
    });
  }
});

// GET /api/auth/me
router.get("/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      ...(req.user.role === "provider" && {
        providerProfile: req.user.providerProfile,
      }),
    },
  });
});

// PUT /api/auth/change-password
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required.",
      });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long.",
      });
    }

    // Check whether new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match.",
      });
    }

    // Prevent using the current password again
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password.",
      });
    }

    // Fetch authenticated user with password
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    // Verify current password
    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Password update error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update password. Please try again.",
    });
  }
});

module.exports = router;
