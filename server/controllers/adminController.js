
const mongoose = require("mongoose");
const Store = require("../models/Store");
const User = require("../models/User");

async function getSellerApplications(req, res) {
    try {
        const stores = await Store.find({
            approvalStatus: "pending"
        })
            .populate("ownerId", "name email")
            .sort({ createdAt: -1 });

        res.json({ stores });
    } catch (error) {
        res.status(500).json({
            message: "Unable to load applications"
        });
    }
}

async function updateSellerApplication(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({
            message: "Invalid application ID"
        });
    }

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
            message: "Invalid approval status"
        });
    }

    try {
        const store = await Store.findById(id);

        if (!store) {
            return res.status(404).json({
                message: "Store not found"
            });
        }

        if (store.approvalStatus !== "pending") {
            return res.status(409).json({
                message: "Application has already been reviewed"
            });
        }

        if (status === "approved") {
            const owner = await User.findOneAndUpdate(
                {
                    _id: store.ownerId,
                    role: "customer",
                    status: "active"
                },
                { $set: { role: "seller" } },
                { new: true }
            );

            if (!owner) {
                return res.status(409).json({
                    message: "Store owner is not eligible for approval"
                });
            }
        }

        store.approvalStatus = status;
        await store.save();

        res.json({
            message: `Seller application ${status}`,
            store
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Unable to update application"
        });
    }
}

async function getAdminSummary(req, res) {
    try {
        const [customers, sellers, pendingStores] =
            await Promise.all([
                User.countDocuments({ role: "customer" }),
                User.countDocuments({ role: "seller" }),
                Store.countDocuments({ approvalStatus: "pending" })
            ]);

        res.json({
            customers,
            sellers,
            pendingStores
        });
    } catch (error) {
        res.status(500).json({
            message: "Unable to load dashboard"
        });
    }
}

module.exports = {
    getSellerApplications,
    updateSellerApplication,
    getAdminSummary
};
