
const STATUS_LEVELS = {
    pending: 0,
    processing: 1,
    shipped: 2,
    delivered: 3
};

export function getOverallOrderStatus(order) {
    // Preserve cancelled orders
    if (order?.orderStatus === "cancelled") {
        return "cancelled";
    }

    const items = order?.items || [];

    if (items.length === 0) {
        return order?.orderStatus || "pending";
    }

    const levels = items.map((item) => {
        const status = item.fulfillmentStatus || "pending";

        return STATUS_LEVELS[status] ?? 0;
    });

    // All products delivered
    if (levels.every((level) => level === 3)) {
        return "delivered";
    }

    // At least one product shipped
    if (levels.some((level) => level >= 2)) {
        return "shipped";
    }

    // At least one product processing
    if (levels.some((level) => level >= 1)) {
        return "processing";
    }

    return "pending";
}
