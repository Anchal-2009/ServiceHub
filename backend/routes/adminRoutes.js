const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Booking = require("../models/Booking");
const { protect, authorize } = require("../middleware/authMiddleware");
const Category = require("../models/Category");
const Service = require("../models/Service");

const router = express.Router();

// GET /api/admin/dashboard
// Fetch statistics and recent bookings for the admin dashboard.
router.get("/dashboard", protect, authorize("admin"), async (req, res) => {
  try {
    const [
      totalUsers,
      totalProviders,
      totalBookings,
      completedBookings,
      monthlyBookings,
      recentBookings,
    ] = await Promise.all([
      User.countDocuments({
        role: "customer",
      }),

      User.countDocuments({
        role: "provider",
      }),

      Booking.countDocuments(),

      Booking.find({
        status: "Completed",
      }).select("price"),

      Booking.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth() - 5,
                1,
              ),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            bookings: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]),

      Booking.find()
        .populate("customer", "name")
        .populate("provider", "name")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const totalRevenue = completedBookings.reduce(
      (total, booking) => total + booking.price,
      0,
    );

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const bookingChart = monthlyBookings.map((item) => ({
      month: monthNames[item._id.month - 1],
      year: item._id.year,
      bookings: item.bookings,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalProviders,
        totalBookings,
        totalRevenue,
      },
      bookingChart,
      recentBookings,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch admin dashboard data.",
    });
  }
});

// GET /api/admin/providers
router.get("/providers", protect, authorize("admin"), async (req, res) => {
  try {
    const providers = await User.find({ role: "provider" })
      .select(
        "name email phone address providerProfile providerStatus isActive createdAt",
      )
      .sort({ createdAt: -1 });

    const formattedProviders = providers.map((provider) => ({
      _id: provider._id,
      name: provider.name,
      email: provider.email,
      phone: provider.phone,
      category: provider.providerProfile?.category || "Not specified",
      experience: provider.providerProfile?.experience || "Not specified",
      location:
        provider.providerProfile?.location ||
        provider.address ||
        "Not specified",
      description: provider.providerProfile?.description || "",
      status: provider.providerStatus || "Pending",
      isActive: provider.isActive,
      applied: provider.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: formattedProviders.length,
      providers: formattedProviders,
    });
  } catch (error) {
    console.error("Fetch providers error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch providers.",
    });
  }
});

// PATCH /api/admin/providers/:id/status
router.patch(
  "/providers/:id/status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { status } = req.body;
      const { id } = req.params;

      if (!["Approved", "Rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be Approved or Rejected.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid provider ID.",
        });
      }

      const provider = await User.findOneAndUpdate(
        { _id: id, role: "provider" },
        { $set: { providerStatus: status } },
        { new: true, runValidators: true },
      ).select("name email phone providerProfile providerStatus isActive");

      if (!provider) {
        return res.status(404).json({
          success: false,
          message: "Provider not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: `Provider ${status.toLowerCase()} successfully.`,
        provider: {
          _id: provider._id,
          name: provider.name,
          email: provider.email,
          phone: provider.phone,
          category: provider.providerProfile?.category || "",
          location: provider.providerProfile?.location || "",
          description: provider.providerProfile?.description || "",
          status: provider.providerStatus,
          isActive: provider.isActive,
        },
      });
    } catch (error) {
      console.error("Update provider status error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to update provider status.",
      });
    }
  },
);

// GET /api/admin/users
// Get all customer and provider accounts
router.get("/users", protect, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["customer", "provider"] },
    })
      .select("name email phone role isActive providerStatus createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const formattedUsers = await Promise.all(
      users.map(async (user) => {
        const bookingQuery =
          user.role === "customer"
            ? { customer: user._id }
            : { provider: user._id };

        const bookings = await Booking.countDocuments(bookingQuery);

        let status = user.isActive === false ? "Suspended" : "Active";

        if (
          user.role === "provider" &&
          user.providerStatus === "Pending" &&
          user.isActive !== false
        ) {
          status = "Pending";
        }

        return {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role === "provider" ? "Provider" : "Customer",
          joined: user.createdAt,
          bookings,
          status,
        };
      }),
    );

    res.status(200).json({
      success: true,
      count: formattedUsers.length,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("Get admin users error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch users.",
    });
  }
});

// PATCH /api/admin/users/:id/status
// Suspend or activate a customer/provider account
router.patch(
  "/users/:id/status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
      }

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid account status.",
        });
      }

      const user = await User.findOneAndUpdate(
        {
          _id: id,
          role: { $in: ["customer", "provider"] },
        },
        {
          $set: { isActive },
        },
        {
          returnDocument: "after",
          runValidators: true,
        },
      ).select("name email phone role isActive providerStatus");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      let status = user.isActive ? "Active" : "Suspended";

      if (
        user.role === "provider" &&
        user.providerStatus === "Pending" &&
        user.isActive
      ) {
        status = "Pending";
      }

      res.status(200).json({
        success: true,
        message: `Account ${isActive ? "activated" : "suspended"} successfully.`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role === "provider" ? "Provider" : "Customer",
          status,
        },
      });
    } catch (error) {
      console.error("Update admin user status error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update account status.",
      });
    }
  },
);

// GET /api/admin/bookings
// Fetch all bookings for admin
router.get("/bookings", protect, authorize("admin"), async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("customer", "name email phone")
      .populate("provider", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    const formattedBookings = bookings.map((booking) => ({
      id: booking._id,
      customer: booking.customer?.name || booking.customerName || "Unknown",
      customerEmail: booking.customer?.email || "—",
      customerPhone: booking.customer?.phone || booking.phone || "—",

      provider: booking.provider?.name || "Unknown",
      providerEmail: booking.provider?.email || "—",

      service: booking.serviceName || "Service",
      category: booking.category || "Other",

      date: booking.date,
      time: booking.time,
      location: booking.address || "—",

      amount: Number(booking.price) || 0,
      payment: "Not recorded",

      status: booking.status,
      created: booking.createdAt,
    }));

    res.status(200).json({
      success: true,
      count: formattedBookings.length,
      bookings: formattedBookings,
    });
  } catch (error) {
    console.error("Get admin bookings error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to fetch bookings.",
    });
  }
});

// PATCH /api/admin/bookings/:id/status
// Update booking status by admin
router.patch(
  "/bookings/:id/status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = [
        "Pending",
        "Confirmed",
        "Completed",
        "Cancelled",
      ];

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking ID.",
        });
      }

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status.",
        });
      }

      const booking = await Booking.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true },
      )
        .populate("customer", "name email phone")
        .populate("provider", "name email phone");

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Booking status updated successfully.",
        booking: {
          id: booking._id,
          customer: booking.customer?.name || booking.customerName || "Unknown",
          customerEmail: booking.customer?.email || "—",
          customerPhone: booking.customer?.phone || booking.phone || "—",
          provider: booking.provider?.name || "Unknown",
          providerEmail: booking.provider?.email || "—",
          service: booking.serviceName || "Service",
          category: booking.category || "Other",
          date: booking.date,
          time: booking.time,
          location: booking.address || "—",
          amount: Number(booking.price) || 0,
          payment: "Not recorded",
          status: booking.status,
          created: booking.createdAt,
        },
      });
    } catch (error) {
      console.error("Update admin booking error:", error);

      res.status(500).json({
        success: false,
        message: "Unable to update booking status.",
      });
    }
  },
);

// GET /api/admin/categories
// Fetch all categories with their service counts.
router.get("/categories", protect, authorize("admin"), async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 }).lean();

    const categoriesWithServices = await Promise.all(
      categories.map(async (category) => {
        const services = await Service.countDocuments({
          category: category.name,
        });

        return {
          id: category._id,
          name: category.name,
          description: category.description,
          icon: category.icon,
          services,
          status: category.isActive ? "Active" : "Inactive",
          createdAt: category.createdAt,
        };
      }),
    );

    return res.status(200).json({
      success: true,
      count: categoriesWithServices.length,
      categories: categoriesWithServices,
    });
  } catch (error) {
    console.error("Fetch categories error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch categories.",
    });
  }
});

// POST /api/admin/categories
// Create a new category.
router.post("/categories", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, description, icon, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || "",
      icon: icon || "Tags",
      isActive: status !== "Inactive",
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category: {
        id: category._id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        services: 0,
        status: category.isActive ? "Active" : "Inactive",
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A category with this name already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create category error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create category.",
    });
  }
});

// PUT /api/admin/categories/:id
// Update category details.
router.put("/categories/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, description, icon, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const updates = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Category name is required.",
        });
      }

      updates.name = name.trim();
    }

    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;

    if (status !== undefined) {
      updates.isActive = status === "Active";
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true },
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      category: {
        id: category._id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        status: category.isActive ? "Active" : "Inactive",
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A category with this name already exists.",
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update category error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update category.",
    });
  }
});

// PATCH /api/admin/categories/:id/status
// Activate or deactivate a category.
router.patch(
  "/categories/:id/status",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const { isActive } = req.body;

      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID.",
        });
      }

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid category status.",
        });
      }

      const category = await Category.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive } },
        { new: true, runValidators: true },
      );

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Category status updated successfully.",
        category: {
          id: category._id,
          status: category.isActive ? "Active" : "Inactive",
        },
      });
    } catch (error) {
      console.error("Update category status error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to update category status.",
      });
    }
  },
);

// DELETE /api/admin/categories/:id
// Delete a category only when no services use it.
router.delete(
  "/categories/:id",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID.",
        });
      }

      const category = await Category.findById(req.params.id);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found.",
        });
      }

      const serviceCount = await Service.countDocuments({
        category: category.name,
      });

      if (serviceCount > 0) {
        return res.status(400).json({
          success: false,
          message: `This category is used by ${serviceCount} service(s). Deactivate it instead of deleting it.`,
        });
      }

      await Category.findByIdAndDelete(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Category deleted successfully.",
      });
    } catch (error) {
      console.error("Delete category error:", error.message);

      return res.status(500).json({
        success: false,
        message: "Unable to delete category.",
      });
    }
  },
);

module.exports = router;
