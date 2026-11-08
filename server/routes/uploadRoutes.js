
const express = require("express");
const multer = require("multer");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");

const upload = require("../middleware/uploadMiddleware");

const {
    uploadProductImage
} = require("../controllers/uploadController");

const router = express.Router();

router.post(
    "/product-image",
    protect,
    authorize("seller"),

    (req, res, next) => {
        upload.single("image")(req, res, (error) => {
            if (error) {
                const status =
                    error instanceof multer.MulterError &&
                        error.code === "LIMIT_FILE_SIZE"
                        ? 413
                        : 400;

                return res.status(status).json({
                    message:
                        error.code === "LIMIT_FILE_SIZE"
                            ? "Image must be 5 MB or smaller"
                            : error.message
                });
            }

            next();
        });
    },

    uploadProductImage
);

module.exports = router;
