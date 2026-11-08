
const mongoose = require("mongoose");

// ========================================
// ORDER ITEM SCHEMA
// ========================================

const orderItemSchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        storeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Store",
            required: true
        },

        productName: {
            type: String,
            required: true,
            trim: true
        },

        image: {
            type: String,
            default: ""
        },

        sku: {
            type: String,
            required: true,
            trim: true
        },

        size: {
            type: String,
            default: ""
        },

        color: {
            type: String,
            default: ""
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        fulfillmentStatus: {
            type: String,
            enum: [
                "pending",
                "processing",
                "shipped",
                "delivered"
            ],
            default: "pending"
        }
    },
    {
        _id: false
    }
);

// ========================================
// SHIPPING ADDRESS SCHEMA
// ========================================

const addressSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            trim: true
        },

        addressLine1: {
            type: String,
            required: true,
            trim: true
        },

        addressLine2: {
            type: String,
            default: "",
            trim: true
        },

        city: {
            type: String,
            required: true,
            trim: true
        },

        district: {
            type: String,
            required: true,
            trim: true
        },

        postalCode: {
            type: String,
            default: "",
            trim: true
        },

        country: {
            type: String,
            default: "Sri Lanka"
        }
    },
    {
        _id: false
    }
);

// ========================================
// MAIN ORDER SCHEMA
// ========================================

const orderSchema = new mongoose.Schema(
    {
        // Customer who placed the order
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // Prevents duplicate checkout submissions
        idempotencyKey: {
            type: String,
            required: true,
            trim: true
        },

        // Identifies the contents of the checkout request
        requestFingerprint: {
            type: String,
            required: true
        },

        // Products purchased
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: function (items) {
                    return items.length > 0;
                },
                message: "An order must contain at least one item."
            }
        },

        // Customer delivery address
        shippingAddress: {
            type: addressSchema,
            required: true
        },

        // Total product cost
        subtotal: {
            type: Number,
            required: true,
            min: 0
        },

        // Delivery fee
        shippingFee: {
            type: Number,
            default: 0,
            min: 0
        },

        // Subtotal + shipping fee
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        // Currency
        currency: {
            type: String,
            enum: ["LKR"],
            default: "LKR"
        },

        // Payment method
        paymentMethod: {
            type: String,
            enum: ["cod"],
            default: "cod"
        },

        // Payment status
        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending"
        },

        // Order fulfillment status
        orderStatus: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled"
            ],
            default: "pending"
        },

        // Additional delivery instructions
        notes: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500
        }
    },
    {
        timestamps: true
    }
);

// ========================================
// DATABASE INDEXES
// ========================================

// Retrieve customer orders efficiently
orderSchema.index({
    customerId: 1,
    createdAt: -1
});

// Support seller order queries
orderSchema.index({
    "items.storeId": 1,
    createdAt: -1
});

// Prevent duplicate orders for the same customer
// using the same checkout idempotency key
orderSchema.index(
    {
        customerId: 1,
        idempotencyKey: 1
    },
    {
        unique: true
    }
);

// ========================================
// EXPORT ORDER MODEL
// ========================================

module.exports = mongoose.model("Order", orderSchema);
