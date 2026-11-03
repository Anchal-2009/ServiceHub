const express = require("express");
const mongoose = require("mongoose");

const Review = require("../models/Review");
const Booking = require("../models/Booking");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/reviews
// Submit a review for a completed booking.
router.post("/", protect, authorize("customer"), async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || rating === undefined || !comment?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a booking, rating, and review comment.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5.",
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Review cannot exceed 1000 characters.",
      });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      customer: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "You can only review completed bookings.",
      });
    }

    const existingReview = await Review.findOne({
      booking: booking._id,
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this booking.",
      });
    }

    const review = await Review.create({
      booking: booking._id,
      customer: req.user._id,
      provider: booking.provider,
      service: booking.service,
      rating: numericRating,
      comment: comment.trim(),
    });

    const populatedReview = await Review.findById(review._id)
      .populate("customer", "name")
      .populate("service", "title");

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully.",
      review: populatedReview,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this booking.",
      });
    }

    console.error("Submit review error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to submit review.",
    });
  }
});

// GET /api/reviews/provider
// Get reviews received by the logged-in provider.
router.get("/provider", protect, authorize("provider"), async (req, res) => {
  try {
    const reviews = await Review.find({
      provider: req.user._id,
    })
      .populate("customer", "name")
      .populate("service", "title")
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews === 0
        ? 0
        : Number(
            (
              reviews.reduce((total, review) => total + review.rating, 0) /
              totalReviews
            ).toFixed(1),
          );

    return res.status(200).json({
      success: true,
      count: totalReviews,
      averageRating,
      reviews,
    });
  } catch (error) {
    console.error("Fetch provider reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch provider reviews.",
    });
  }
});

module.exports = router;
