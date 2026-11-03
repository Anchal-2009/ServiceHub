const express = require("express");
const Service = require("../models/Service");
const { protect, authorize } = require("../middleware/authMiddleware");
const cloudinary = require("../config/cloudinary");
const upload = require("../middleware/uploadMiddleware");
const Category = require("../models/Category");

const router = express.Router();

// GET /api/services
// Get all active services for customers and other visitors.
router.get("/", async (req, res) => {
  try {
    const { category, location, search } = req.query;

    const filter = { isActive: true };

    if (category) {
      filter.category = category;
    }

    if (location) {
      filter.location = {
        $regex: location,
        $options: "i",
      };
    }

    if (search) {
      const searchRegex = {
        $regex: search,
        $options: "i",
      };

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { location: searchRegex },
      ];
    }

    const services = await Service.find(filter)
      .populate("provider", "name")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Fetch services error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch services.",
    });
  }
});

// GET /api/services/mine
// Get services belonging to the logged-in provider.
router.get("/mine", protect, authorize("provider"), async (req, res) => {
  try {
    const services = await Service.find({
      provider: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: services.length,
      services,
    });
  } catch (error) {
    console.error("Fetch provider services error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your services.",
    });
  }
});

// POST /api/services
// Create a service for the logged-in provider.
router.post("/", protect, authorize("provider"), async (req, res) => {
  try {
    const { title, category, description, price, location, image } = req.body;

    if (
      !title ||
      !category ||
      !description ||
      price === undefined ||
      price === null ||
      price === "" ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required service details.",
      });
    }

    const validCategory = await Category.findOne({
      name: category.trim(),
      isActive: true,
    });

    if (!validCategory) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid and active category.",
      });
    }

    const service = await Service.create({
      provider: req.user._id,
      title,
      category: validCategory.name,
      description,
      price,
      location,
      image,
    });

    return res.status(201).json({
      success: true,
      message: "Service created successfully.",
      service,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create service error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create service.",
    });
  }
});

// PUT /api/services/:id
// Update a service owned by the logged-in provider.
router.put("/:id", protect, authorize("provider"), async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "category",
      "description",
      "price",
      "location",
      "image",
      "isActive",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update.",
      });
    }

    if (updates.category !== undefined) {
      const validCategory = await Category.findOne({
        name: updates.category.trim(),
        isActive: true,
      });

      if (!validCategory) {
        return res.status(400).json({
          success: false,
          message: "Please select a valid and active category.",
        });
      }

      updates.category = updates.category.trim();
    }

    const service = await Service.findOneAndUpdate(
      {
        _id: req.params.id,
        provider: req.user._id,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or you do not own this service.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service updated successfully.",
      service,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update service error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update service.",
    });
  }
});

// DELETE /api/services/:id
// Delete a service owned by the logged-in provider.
router.delete("/:id", protect, authorize("provider"), async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({
      _id: req.params.id,
      provider: req.user._id,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or you do not own this service.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service deleted successfully.",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    console.error("Delete service error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to delete service.",
    });
  }
});

// POST /api/services/upload
// Upload service image to Cloudinary.

router.post(
  "/upload",
  protect,
  authorize("provider"),
  (req, res, next) => {
    upload.single("image")(req, res, (error) => {
      if (error) {
        return res.status(400).json({
          success: false,
          message:
            error.code === "LIMIT_FILE_SIZE"
              ? "Image size must not exceed 5 MB."
              : error.message,
        });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please select an image to upload.",
        });
      }

      const base64Image = req.file.buffer.toString("base64");

      const imageData = `data:${req.file.mimetype};base64,${base64Image}`;

      const result = await cloudinary.uploader.upload(imageData, {
        folder: "servicehub/services",
        resource_type: "image",
      });

      return res.status(201).json({
        success: true,
        message: "Image uploaded successfully.",
        image: result.secure_url,
        publicId: result.public_id,
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);

      return res.status(500).json({
        success: false,
        message: "Image upload failed. Please try again.",
      });
    }
  },
);

// GET /api/services/categories
// Get active categories for provider forms and customer filters.
router.get("/categories", async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select("name description icon")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error("Fetch service categories error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch categories.",
    });
  }
});

module.exports = router;
