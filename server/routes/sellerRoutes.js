
const express = require("express");

const {
    applyForSeller,
    getMyStore
} = require("../controllers/sellerController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// Customer submits a seller application
router.post(
    "/apply",
    protect,
    authorize("customer"),
    applyForSeller
);

// Logged-in user checks their store
router.get(
    "/my-store",
    protect,
    getMyStore
);

// Approved sellers only
router.get(
    "/dashboard",
    protect,
    authorize("seller"),
    (req, res) => {
        res.json({
            message: "Welcome to VESTRA Seller Dashboard"
        });
    }
);

module.exports = router;
