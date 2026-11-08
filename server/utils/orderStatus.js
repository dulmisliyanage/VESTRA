
const STATUS_LEVELS = {
    pending: 0,
    processing: 1,
    shipped: 2,
    delivered: 3
};

function calculateOrderStatus(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return "pending";
    }

    const levels = items.map((item) => {
        const status = item.fulfillmentStatus || "pending";
        return STATUS_LEVELS[status] ?? 0;
    });

    // Every item must be delivered
    if (levels.every((level) => level === 3)) {
        return "delivered";
    }

    // At least one item has shipped
    if (levels.some((level) => level >= 2)) {
        return "shipped";
    }

    // At least one item is being processed
    if (levels.some((level) => level >= 1)) {
        return "processing";
    }

    return "pending";
}

module.exports = {
    calculateOrderStatus
};
