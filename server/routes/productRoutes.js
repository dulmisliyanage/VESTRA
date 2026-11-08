
const express = require("express");

const {
    createProduct,
    getMyProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    getPublicProducts
} = require("../controllers/productController");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const router = express.Router();

// Seller-only endpoints
router.post(
    "/",
    protect,
    authorize("seller"),
    createProduct
);

router.get(
    "/my-products",
    protect,
    authorize("seller"),
    getMyProducts
);

router.patch(
    "/:id",
    protect,
    authorize("seller"),
    updateProduct
);

router.delete(
    "/:id",
    protect,
    authorize("seller"),
    deleteProduct
);

// Public product details

router.get("/", getPublicProducts);
router.get("/:id", getProduct);

module.exports = router;
