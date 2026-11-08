
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 80
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        passwordHash: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: ["customer", "seller", "admin"],
            default: "customer"
        },

        phone: {
            type: String,
            default: ""
        },

        addresses: [
            {
                fullName: String,
                phone: String,
                addressLine: String,
                city: String,
                postalCode: String,
                country: {
                    type: String,
                    default: "Sri Lanka"
                }
            }
        ],

        status: {
            type: String,
            enum: ["active", "suspended"],
            default: "active"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
