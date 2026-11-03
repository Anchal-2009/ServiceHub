const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
require("dotenv").config();

const authRoutes = require("./routes/Auth");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");

const connectDB = require("./config/db");

const app = express();

// Middleware
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  }),
);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// Start server after connecting to MongoDB
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`ServiceHub backend running on port ${PORT}`);
  });
};

startServer();
