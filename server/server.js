
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

// Import routes
const authRoutes = require("./routes/authRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const orderRoutes = require("./routes/orderRoutes");
const sellerOrderRoutes = require("./routes/sellerOrderRoutes");

const app = express();
app.set("trust proxy", 1);

// Environment configuration
const PORT = process.env.PORT || 5000;
const CLIENT_URL =
    process.env.CLIENT_URL || "http://localhost:5173";

// Security middleware
app.use(helmet());

// Allow requests from the React frontend
app.use(
    cors({
        origin: CLIENT_URL,
        credentials: true
    })
);

// Parse JSON request bodies
app.use(express.json({ limit: "1mb" }));

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Read cookies from incoming requests
app.use(cookieParser());

// Rate limiter for authentication requests
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Too many requests. Please try again later."
    }
});

// Health check
app.get("/api", (req, res) => {
    res.status(200).json({
        message: "VESTRA API is running"
    });
});

// Register API routes
app.use("/api/auth", authLimiter, authRoutes);

app.use("/api/seller", sellerRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/products", productRoutes);

app.use("/api/orders", orderRoutes);
app.use("/api/seller/orders", sellerOrderRoutes);
// Cloudinary image upload routes
app.use("/api/uploads", uploadRoutes);

// Handle unknown API endpoints
app.use((req, res) => {
    res.status(404).json({
        message: "API endpoint not found"
    });
});

// Centralized error handler
app.use((err, req, res, next) => {
    console.error("Unhandled server error:", err);

    res.status(500).json({
        message: "Internal server error"
    });
});

// Connect to MongoDB and start the server
async function startServer() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is missing from .env");
        }

        if (
            !process.env.JWT_SECRET ||
            process.env.JWT_SECRET.length < 32
        ) {
            throw new Error(
                "JWT_SECRET must contain at least 32 characters"
            );
        }

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(
                `VESTRA backend running at http://localhost:${PORT}`
            );

            console.log(
                `Frontend allowed: ${CLIENT_URL}`
            );
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
