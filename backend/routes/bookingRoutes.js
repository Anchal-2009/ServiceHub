const express = require("express");
const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Service = require("../models/Service");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/bookings
// Create a booking for the logged-in customer.
router.post("/", protect, authorize("customer"), async (req, res) => {
  try {
    const {
      serviceId,
      date,
      time,
      customerName,
      phone,
      address,
      instructions,
    } = req.body;

    if (
      !serviceId ||
      !date ||
      !time ||
      !customerName?.trim() ||
      !phone?.trim() ||
      !address?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking details.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    if (!/^[0-9]{10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit phone number.",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid appointment date.",
      });
    }

    const [year, month, day] = date.split("-").map(Number);
    const appointmentDate = new Date(year, month - 1, day);

    if (
      appointmentDate.getFullYear() !== year ||
      appointmentDate.getMonth() !== month - 1 ||
      appointmentDate.getDate() !== day
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid appointment date.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      return res.status(400).json({
        success: false,
        message: "Appointment date cannot be in the past.",
      });
    }

    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid appointment time.",
      });
    }

    const service = await Service.findOne({
      _id: serviceId,
      isActive: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Selected service is not available.",
      });
    }

    const booking = await Booking.create({
      customer: req.user._id,
      provider: service.provider,
      service: service._id,
      serviceName: service.title,
      category: service.category,
      price: service.price,
      date: appointmentDate,
      time,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      instructions: instructions?.trim() || "",
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Booking request submitted successfully.",
      booking,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create booking error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create booking. Please try again.",
    });
  }
});

// GET /api/bookings/mine
// Get bookings created by the logged-in customer.
router.get("/mine", protect, authorize("customer"), async (req, res) => {
  try {
    const bookings = await Booking.find({
      customer: req.user._id,
    })
      .populate("provider", "name")
      .populate("service", "title category image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Fetch customer bookings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your bookings.",
    });
  }
});

// GET /api/bookings/provider
// Get bookings assigned to the logged-in provider.
router.get("/provider", protect, authorize("provider"), async (req, res) => {
  try {
    const bookings = await Booking.find({
      provider: req.user._id,
    })
      .populate("customer", "name email")
      .populate("service", "title category image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Fetch provider bookings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch provider bookings.",
    });
  }
});

// PATCH /api/bookings/:id/status
router.patch(
  "/:id/status",
  protect,
  authorize("provider"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking ID.",
        });
      }

      const allowedTransitions = {
        Pending: ["Confirmed", "Cancelled"],
        Confirmed: ["In Progress"],
        "In Progress": ["Completed"],
      };

      if (
        !["Confirmed", "In Progress", "Completed", "Cancelled"].includes(status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status.",
        });
      }

      const booking = await Booking.findOne({
        _id: id,
        provider: req.user._id,
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      const permittedStatuses = allowedTransitions[booking.status] || [];

      if (!permittedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot change booking from ${booking.status} to ${status}.`,
        });
      }

      booking.status = status;
      await booking.save();

      return res.status(200).json({
        success: true,
        message: `Booking status updated to ${status}.`,
        booking,
      });
    } catch (error) {
      console.error("Update booking status error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update booking status.",
      });
    }
  },
);

// PATCH /api/bookings/:id/cancel
router.patch(
  "/:id/cancel",
  protect,
  authorize("customer"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking ID.",
        });
      }

      const booking = await Booking.findOne({
        _id: id,
        customer: req.user._id,
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found.",
        });
      }

      if (!["Pending", "Confirmed"].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          message: `A ${booking.status} booking cannot be cancelled.`,
        });
      }

      booking.status = "Cancelled";
      await booking.save();

      return res.status(200).json({
        success: true,
        message: "Booking cancelled successfully.",
        booking,
      });
    } catch (error) {
      console.error("Cancel booking error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to cancel booking.",
      });
    }
  },
);

module.exports = router;
