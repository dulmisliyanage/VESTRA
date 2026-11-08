
const express = require("express");

const {
    getSellerApplications,
    updateSellerApplication,
    getAdminSummary,
} = require("../controllers/adminController");

const {
    getAdminOrders,
    getAdminOrderById,
    confirmCodPayment,
} = require("../controllers/adminOrderController");

const {
    protect,
    authorize,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// ADMIN AUTHORIZATION
// ========================================

// All routes require authentication
router.use(protect);

// Only administrators can access these routes
router.use(authorize("admin"));

// ========================================
// DASHBOARD
// ========================================

// GET /api/admin/summary
router.get("/summary", getAdminSummary);

// ========================================
// SELLER APPLICATIONS
// ========================================

// GET /api/admin/seller-applications
router.get(
    "/seller-applications",
    getSellerApplications
);

// PATCH /api/admin/seller-applications/:id
router.patch(
    "/seller-applications/:id",
    updateSellerApplication
);

// ========================================
// ORDER MANAGEMENT
// ========================================

// GET /api/admin/orders
router.get("/orders", getAdminOrders);

// GET /api/admin/orders/:id
router.get("/orders/:id", getAdminOrderById);

// PATCH /api/admin/orders/:id/confirm-payment
router.patch(
    "/orders/:id/confirm-payment",
    confirmCodPayment
);

module.exports = router;
