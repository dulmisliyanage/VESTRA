
const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        storeName: {
            type: String,
            required: true,
            trim: true
        },

        slug: {
            type: String,
            required: true,
            unique: true
        },

        description: {
            type: String,
            default: ""
        },

        logo: {
            type: String,
            default: ""
        },

        approvalStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Store", storeSchema);
