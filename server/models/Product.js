
const mongoose = require("mongoose");

// Each size and color combination has its own stock
const variantSchema = new mongoose.Schema(
    {
        size: {
            type: String,
            required: true,
            trim: true
        },

        color: {
            type: String,
            required: true,
            trim: true
        },

        sku: {
            type: String,
            required: true,
            trim: true
        },

        stock: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        }
    },
    { _id: true }
);

// Main product schema
const productSchema = new mongoose.Schema(
    {
        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true,
            index: true
        },

        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 3000
        },

        category: {
            type: String,
            required: true,
            enum: [
                "Men",
                "Women",
                "Unisex",
                "Accessories",
                "Footwear"
            ]
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        images: [
            {
                type: String,
                trim: true
            }
        ],

        variants: {
            type: [variantSchema],
            default: []
        },

        status: {
            type: String,
            enum: ["draft", "active", "archived"],
            default: "draft"
        }
    },
    {
        timestamps: true,
        optimisticConcurrency: true
    }
);

// Prevent duplicate SKU values within a product
productSchema.path("variants").validate(function (variants) {
    const skus = variants.map((variant) =>
        variant.sku.toLowerCase()
    );

    return new Set(skus).size === skus.length;
}, "Variant SKUs must be unique within a product");

// Export model
module.exports = mongoose.model("Product", productSchema);
