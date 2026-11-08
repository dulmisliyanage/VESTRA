
const express = require("express");

const {
    getSellerOrders,
    getSellerOrderById,
    updateSellerOrderItemStatus
} = require("../controllers/sellerOrderController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// Only authenticated sellers
router.use(protect);
router.use(authorize("seller"));

// Get all orders for this seller
router.get("/", getSellerOrders);

// Get a specific order
router.get("/:id", getSellerOrderById);

// Update an order item's fulfillment status
router.patch(
    "/:orderId/items/:itemIndex/status",
    updateSellerOrderItemStatus
);

module.exports = router;
