
const mongoose = require("mongoose");
const Order = require("../models/Order");

// ========================================
// GET ALL MARKETPLACE ORDERS
// ========================================

async function getAdminOrders(req, res) {
    try {
        const {
            status,
            paymentStatus,
            search,
            page = 1,
            limit = 10,
        } = req.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1 ||
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                message: "Invalid pagination parameters",
            });
        }

        const filter = {};

        if (status && status !== "all") {
            const validStatuses = [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
            ];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message: "Invalid order status",
                });
            }

            filter.orderStatus = status;
        }

        if (paymentStatus && paymentStatus !== "all") {
            if (!["pending", "paid", "failed"].includes(paymentStatus)) {
                return res.status(400).json({
                    message: "Invalid payment status",
                });
            }

            filter.paymentStatus = paymentStatus;
        }

        if (search && String(search).trim()) {
            const searchValue = String(search).trim();

            if (mongoose.isValidObjectId(searchValue)) {
                filter._id = new mongoose.Types.ObjectId(searchValue);
            } else {
                // Find customers by name or email.
                const escapedSearch = searchValue.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                );

                const matchingCustomers = await mongoose
                    .model("User")
                    .find({
                        $or: [
                            { name: { $regex: escapedSearch, $options: "i" } },
                            { email: { $regex: escapedSearch, $options: "i" } },
                        ],
                    })
                    .select("_id");

                filter.customerId = {
                    $in: matchingCustomers.map((customer) => customer._id),
                };
            }
        }

        const skip = (pageNumber - 1) * limitNumber;

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate("customerId", "name email")
                .populate("items.storeId", "storeName")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNumber)
                .lean(),

            Order.countDocuments(filter),
        ]);

        return res.json({
            orders,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages: Math.ceil(total / limitNumber),
            },
        });
    } catch (error) {
        console.error("Admin orders error:", error);

        return res.status(500).json({
            message: "Unable to load orders",
        });
    }
}

// ========================================
// GET SINGLE ORDER
// ========================================

async function getAdminOrderById(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid order ID",
            });
        }

        const order = await Order.findById(id)
            .populate("customerId", "name email")
            .populate("items.storeId", "storeName")
            .lean();

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
            });
        }

        return res.json({ order });
    } catch (error) {
        console.error("Admin order details error:", error);

        return res.status(500).json({
            message: "Unable to load order details",
        });
    }
}

// ========================================
// CONFIRM CASH ON DELIVERY PAYMENT
// ========================================

async function confirmCodPayment(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: "Invalid order ID",
            });
        }

        // Only delivered COD orders are eligible.
        // The update is atomic to prevent duplicate confirmations.
        const order = await Order.findOneAndUpdate(
            {
                _id: id,
                paymentMethod: "cod",
                paymentStatus: "pending",
                orderStatus: "delivered",
                "items.0": { $exists: true },
                items: {
                    $not: {
                        $elemMatch: {
                            fulfillmentStatus: { $ne: "delivered" },
                        },
                    },
                },
            },
            {
                $set: {
                    paymentStatus: "paid",
                },
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!order) {
            const existingOrder = await Order.findById(id);

            if (!existingOrder) {
                return res.status(404).json({
                    message: "Order not found",
                });
            }

            if (existingOrder.paymentMethod !== "cod") {
                return res.status(400).json({
                    message: "This order does not use Cash on Delivery",
                });
            }

            if (existingOrder.paymentStatus === "paid") {
                return res.status(409).json({
                    message: "Payment has already been confirmed",
                });
            }

            return res.status(409).json({
                message:
                    "COD payment can only be confirmed for fully delivered orders with pending payment",
            });
        }

        return res.json({
            message: "COD payment confirmed successfully",
            order,
        });
    } catch (error) {
        console.error("COD confirmation error:", error);

        return res.status(500).json({
            message: "Unable to confirm COD payment",
        });
    }
}

module.exports = {
    getAdminOrders,
    getAdminOrderById,
    confirmCodPayment,
};
