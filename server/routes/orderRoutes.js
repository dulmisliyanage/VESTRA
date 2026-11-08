
const express = require("express");

const {
    createOrder,
    getMyOrders,
    getMyOrderById
} = require("../controllers/orderController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// All order routes require authentication
// Only customers can place and view their own orders
router.use(protect);
router.use(authorize("customer"));

// POST /api/orders
// Create a new customer order
router.post("/", createOrder);

// GET /api/orders/my-orders
// Get all orders belonging to the logged-in customer
router.get("/my-orders", getMyOrders);

// GET /api/orders/:id
// Get a specific order belonging to the customer
router.get("/:id", getMyOrderById);

module.exports = router;
