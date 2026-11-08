const { calculateOrderStatus } = require("../utils/orderStatus");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Store = require("../models/Store");

// Get the logged-in seller's approved store
async function getSellerStore(userId) {
    return Store.findOne({
        ownerId: userId,
        approvalStatus: "approved"
    });
}

// GET /api/seller/orders
// Return only order items belonging to this seller
exports.getSellerOrders = async (req, res) => {
    try {
        const store = await getSellerStore(req.user._id);

        if (!store) {
            return res.status(403).json({
                message: "You do not have an approved seller store."
            });
        }

        const orders = await Order.find({
            "items.storeId": store._id
        })
            .sort({ createdAt: -1 })
            .lean();

        const sellerOrders = orders.map((order) => {
            const sellerItems = order.items
                .map((item, originalIndex) => ({
                    ...item,
                    originalIndex
                }))
                .filter(
                    (item) =>
                        String(item.storeId) === String(store._id)
                );

            const sellerSubtotal = sellerItems.reduce(
                (total, item) => total + item.subtotal,
                0
            );

            return {
                _id: order._id,
                createdAt: order.createdAt,
                orderStatus: order.orderStatus,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                items: sellerItems,
                sellerSubtotal,
                currency: order.currency
            };
        });

        return res.status(200).json({
            orders: sellerOrders
        });
    } catch (error) {
        console.error("Get seller orders error:", error);

        return res.status(500).json({
            message: "Unable to retrieve seller orders."
        });
    }
};

// GET /api/seller/orders/:id
// Return only this seller's items in a specific order
exports.getSellerOrderById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid order ID."
            });
        }

        const store = await getSellerStore(req.user._id);

        if (!store) {
            return res.status(403).json({
                message: "You do not have an approved seller store."
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            "items.storeId": store._id
        }).lean();

        if (!order) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        const sellerItems = order.items.filter(
            (item) =>
                String(item.storeId) === String(store._id)
        );

        const sellerSubtotal = sellerItems.reduce(
            (total, item) => total + item.subtotal,
            0
        );

        return res.status(200).json({
            order: {
                _id: order._id,
                createdAt: order.createdAt,
                orderStatus: order.orderStatus,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                items: sellerItems,
                sellerSubtotal,
                currency: order.currency
            }
        });
    } catch (error) {
        console.error("Get seller order error:", error);

        return res.status(500).json({
            message: "Unable to retrieve seller order."
        });
    }

};

// ========================================
// UPDATE SELLER ORDER ITEM STATUS
// PATCH /api/seller/orders/:orderId/items/:itemIndex/status
// ========================================


exports.updateSellerOrderItemStatus = async (req, res) => {
    try {
        const { orderId, itemIndex } = req.params;
        const { fulfillmentStatus } = req.body;

        if (!mongoose.isValidObjectId(orderId)) {
            return res.status(400).json({
                message: "Invalid order ID."
            });
        }

        const index = Number(itemIndex);

        if (
            !Number.isSafeInteger(index) ||
            index < 0 ||
            String(index) !== itemIndex
        ) {
            return res.status(400).json({
                message: "Invalid order item index."
            });
        }

        const transitions = {
            pending: ["processing"],
            processing: ["shipped"],
            shipped: ["delivered"],
            delivered: []
        };

        if (!Object.prototype.hasOwnProperty.call(
            transitions,
            fulfillmentStatus
        )) {
            return res.status(400).json({
                message: "Invalid fulfillment status."
            });
        }

        const store = await getSellerStore(req.user._id);

        if (!store) {
            return res.status(403).json({
                message: "You do not have an approved seller store."
            });
        }

        // Load the order and check ownership.
        const order = await Order.findOne({
            _id: orderId,
            [`items.${index}.storeId`]: store._id
        }).lean();

        if (!order || !order.items[index]) {
            return res.status(404).json({
                message: "Order item not found for your store."
            });
        }

        if (order.orderStatus === "cancelled") {
            return res.status(409).json({
                message: "Cancelled orders cannot be updated."
            });
        }

        const currentStatus =
            order.items[index].fulfillmentStatus || "pending";

        if (currentStatus === fulfillmentStatus) {
            return res.status(200).json({
                message: "Item already has this status.",
                fulfillmentStatus: currentStatus,
                orderStatus: order.orderStatus
            });
        }

        if (!transitions[currentStatus]?.includes(
            fulfillmentStatus
        )) {
            return res.status(409).json({
                message:
                    `Cannot change fulfillment status from ${currentStatus} to ${fulfillmentStatus}.`
            });
        }

        // Calculate the new overall status from all items.
        const updatedItems = order.items.map((item, i) => ({
            ...item,
            fulfillmentStatus:
                i === index
                    ? fulfillmentStatus
                    : item.fulfillmentStatus || "pending"
        }));

        const newOrderStatus = calculateOrderStatus(updatedItems);

        const statusPath = `items.${index}.fulfillmentStatus`;

        const currentStatusCondition =
            currentStatus === "pending"
                ? {
                    $or: [
                        { [statusPath]: "pending" },
                        { [statusPath]: { $exists: false } }
                    ]
                }
                : { [statusPath]: currentStatus };

        // Optimistic concurrency:
        // If another seller changed the order since our read,
        // the update fails and the user can refresh.
        const result = await Order.updateOne(
            {
                _id: orderId,
                [`items.${index}.storeId`]: store._id,
                orderStatus: order.orderStatus,
                updatedAt: order.updatedAt,
                ...currentStatusCondition
            },
            {
                $set: {
                    [statusPath]: fulfillmentStatus,
                    orderStatus: newOrderStatus
                }
            },
            {
                runValidators: true
            }
        );

        if (result.modifiedCount !== 1) {
            return res.status(409).json({
                message:
                    "The order changed while processing. Refresh and try again."
            });
        }

        return res.status(200).json({
            message: "Fulfillment and order statuses updated.",
            fulfillmentStatus,
            orderStatus: newOrderStatus
        });
    } catch (error) {
        console.error(
            "Update seller order item status error:",
            error
        );

        return res.status(500).json({
            message: "Unable to update order status."
        });
    }
};


