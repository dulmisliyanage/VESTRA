
const crypto = require("node:crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");

// ------------------------------------
// HELPER: CREATE HTTP ERROR
// ------------------------------------

function createHttpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// ------------------------------------
// HELPER: VALIDATE SHIPPING ADDRESS
// ------------------------------------

function validateShippingAddress(address) {
    if (
        !address ||
        typeof address !== "object" ||
        Array.isArray(address)
    ) {
        throw createHttpError(
            400,
            "Shipping address is required."
        );
    }

    const requiredFields = [
        "fullName",
        "phone",
        "addressLine1",
        "city",
        "district"
    ];

    for (const field of requiredFields) {
        if (
            typeof address[field] !== "string" ||
            !address[field].trim() ||
            address[field].length > 200
        ) {
            throw createHttpError(
                400,
                `Please provide a valid ${field}.`
            );
        }
    }

    const optionalFields = [
        "addressLine2",
        "postalCode"
    ];

    for (const field of optionalFields) {
        if (
            address[field] !== undefined &&
            (
                typeof address[field] !== "string" ||
                address[field].length > 200
            )
        ) {
            throw createHttpError(
                400,
                `Invalid ${field}.`
            );
        }
    }

    return {
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        addressLine1: address.addressLine1.trim(),
        addressLine2: (address.addressLine2 || "").trim(),
        city: address.city.trim(),
        district: address.district.trim(),
        postalCode: (address.postalCode || "").trim(),
        country: "Sri Lanka"
    };
}

// ------------------------------------
// HELPER: VALIDATE CART ITEMS
// ------------------------------------

function normalizeItems(items) {
    if (
        !Array.isArray(items) ||
        items.length === 0 ||
        items.length > 50
    ) {
        throw createHttpError(
            400,
            "Your cart must contain between 1 and 50 items."
        );
    }

    const merged = new Map();

    for (const item of items) {
        if (
            !item ||
            !mongoose.isValidObjectId(item.productId) ||
            typeof item.sku !== "string" ||
            !item.sku.trim() ||
            !Number.isSafeInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > 100
        ) {
            throw createHttpError(
                400,
                "Invalid cart item."
            );
        }

        const productId = String(item.productId);
        const sku = item.sku.trim();

        const key = `${productId}:${sku}`;

        const existing = merged.get(key);

        const quantity =
            (existing?.quantity || 0) + item.quantity;

        if (quantity > 100) {
            throw createHttpError(
                400,
                "Maximum quantity per variant is 100."
            );
        }

        merged.set(key, {
            productId,
            sku,
            quantity
        });
    }

    return [...merged.values()].sort((a, b) => {
        const keyA = `${a.productId}:${a.sku}`;
        const keyB = `${b.productId}:${b.sku}`;

        return keyA.localeCompare(keyB);
    });
}

// ------------------------------------
// HELPER: REQUEST FINGERPRINT
// ------------------------------------

function getFingerprint(data) {
    return crypto
        .createHash("sha256")
        .update(JSON.stringify(data))
        .digest("hex");
}

// ------------------------------------
// HELPER: DUPLICATE KEY ERROR
// ------------------------------------

function isDuplicateKeyError(error) {
    return error?.code === 11000;
}

// ------------------------------------
// HELPER: CHECK EXISTING ORDER
// ------------------------------------

async function findExistingOrder(
    customerId,
    idempotencyKey,
    requestFingerprint
) {
    const existingOrder = await Order.findOne({
        customerId,
        idempotencyKey
    });

    if (!existingOrder) {
        return null;
    }

    if (
        existingOrder.requestFingerprint !==
        requestFingerprint
    ) {
        throw createHttpError(
            409,
            "This checkout key was already used for a different order."
        );
    }

    return existingOrder;
}

// ------------------------------------
// CREATE ORDER
// POST /api/orders
// ------------------------------------

exports.createOrder = async (req, res) => {
    let session = null;
    console.log(">>> VESTRA CHECKOUT REQUEST RECEIVED <<<");
    console.log("Checkout key:", req.body?.idempotencyKey);

    try {
        const {
            items,
            shippingAddress,
            notes = "",
            idempotencyKey
        } = req.body || {};

        // Validate checkout key
        if (
            typeof idempotencyKey !== "string" ||
            !/^[a-zA-Z0-9_-]{16,128}$/.test(
                idempotencyKey
            )
        ) {
            throw createHttpError(
                400,
                "A valid checkout idempotency key is required."
            );
        }

        // Validate notes
        if (
            typeof notes !== "string" ||
            notes.length > 500
        ) {
            throw createHttpError(
                400,
                "Order notes must be 500 characters or fewer."
            );
        }

        // Validate request data
        const normalizedItems = normalizeItems(items);

        const address = validateShippingAddress(
            shippingAddress
        );

        const normalizedNotes = notes.trim();

        const customerId = req.user._id;

        // Generate request fingerprint
        const requestFingerprint = getFingerprint({
            items: normalizedItems,
            shippingAddress: address,
            notes: normalizedNotes
        });

        // Check if this checkout was already completed
        const existingOrder = await findExistingOrder(
            customerId,
            idempotencyKey,
            requestFingerprint
        );

        if (existingOrder) {
            return res.status(200).json({
                message: "Order already placed.",
                order: existingOrder
            });
        }

        // Start MongoDB transaction
        session = await mongoose.startSession();

        let createdOrder = null;

        await session.withTransaction(async () => {
            const orderItems = [];

            let subtotal = 0;

            // Process each product variant
            for (const item of normalizedItems) {
                // Decrease stock only if enough stock exists.
                // This update is part of the transaction.
                const product = await Product.findOneAndUpdate(
                    {
                        _id: item.productId,
                        status: "active",
                        variants: {
                            $elemMatch: {
                                sku: item.sku,
                                stock: {
                                    $gte: item.quantity
                                }
                            }
                        }
                    },
                    {
                        $inc: {
                            "variants.$.stock": -item.quantity,
                            __v: 1
                        }
                    },
                    {
                        returnDocument: "before",
                        session,
                        runValidators: true
                    }
                );

                if (!product) {
                    throw createHttpError(
                        409,
                        `Product variant ${item.sku} is unavailable or has insufficient stock.`
                    );
                }

                // Find selected variant
                const variant = product.variants.find(
                    (variant) => variant.sku === item.sku
                );

                if (!variant) {
                    throw createHttpError(
                        409,
                        "Selected product variant is unavailable."
                    );
                }

                // Use price stored in MongoDB
                const price = Number(product.price);

                if (
                    !Number.isFinite(price) ||
                    price < 0
                ) {
                    throw createHttpError(
                        409,
                        "Invalid product price."
                    );
                }

                const itemSubtotal =
                    price * item.quantity;

                if (!Number.isSafeInteger(itemSubtotal)) {
                    throw createHttpError(
                        409,
                        "Invalid order amount."
                    );
                }

                orderItems.push({
                    productId: product._id,
                    storeId: product.storeId,
                    productName: product.name,
                    image: product.images?.[0] || "",
                    sku: variant.sku,
                    size: variant.size,
                    color: variant.color,
                    price,
                    quantity: item.quantity,
                    subtotal: itemSubtotal
                });

                subtotal += itemSubtotal;
            }

            if (!Number.isSafeInteger(subtotal)) {
                throw createHttpError(
                    409,
                    "Invalid order subtotal."
                );
            }

            // Development shipping fee
            const shippingFee = 350;

            const totalAmount =
                subtotal + shippingFee;

            // Create order in same transaction
            const orders = await Order.create(
                [
                    {
                        customerId,
                        idempotencyKey,
                        requestFingerprint,
                        items: orderItems,
                        shippingAddress: address,
                        subtotal,
                        shippingFee,
                        totalAmount,
                        currency: "LKR",
                        paymentMethod: "cod",
                        paymentStatus: "pending",
                        orderStatus: "pending",
                        notes: normalizedNotes
                    }
                ],
                { session }
            );

            createdOrder = orders[0];
        });

        return res.status(201).json({
            message: "Order placed successfully.",
            order: createdOrder
        });
    } catch (error) {
        // Log useful error details
        console.error(
            "========== CHECKOUT ERROR =========="
        );

        console.error("Message:", error.message);
        console.error("Code:", error.code);
        console.error("Index:", error.index);
        console.error("Key Pattern:", error.keyPattern);
        console.error("Key Value:", error.keyValue);

        console.error(
            "===================================="
        );

        // Handle MongoDB duplicate key errors
        if (isDuplicateKeyError(error)) {
            try {
                const customerId = req.user?._id;
                const idempotencyKey =
                    req.body?.idempotencyKey;

                const normalizedItems = normalizeItems(
                    req.body?.items
                );

                const address = validateShippingAddress(
                    req.body?.shippingAddress
                );

                const notes =
                    typeof req.body?.notes === "string"
                        ? req.body.notes.trim()
                        : "";

                const requestFingerprint = getFingerprint({
                    items: normalizedItems,
                    shippingAddress: address,
                    notes
                });

                const existingOrder = await findExistingOrder(
                    customerId,
                    idempotencyKey,
                    requestFingerprint
                );

                if (existingOrder) {
                    return res.status(200).json({
                        message: "Order already placed.",
                        order: existingOrder
                    });
                }
            } catch (lookupError) {
                if (lookupError.status === 409) {
                    return res.status(409).json({
                        message: lookupError.message
                    });
                }

                console.error(
                    "Duplicate order lookup failed:",
                    lookupError.message
                );
            }

            // A duplicate index error may be caused
            // by an existing MongoDB index.
            return res.status(409).json({
                message:
                    "Order could not be created because of a database uniqueness conflict. Please contact the developer."
            });
        }

        // Handle known validation errors
        if (error.status) {
            return res.status(error.status).json({
                message: error.message
            });
        }

        // Handle unexpected errors
        console.error(
            "Unexpected order error:",
            error
        );

        return res.status(500).json({
            message:
                "Unable to place your order. Please try again."
        });
    } finally {
        if (session) {
            await session.endSession();
        }
    }
};

// ------------------------------------
// GET CUSTOMER ORDERS
// GET /api/orders/my-orders
// ------------------------------------

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            customerId: req.user._id
        }).sort({
            createdAt: -1
        });

        return res.status(200).json({
            orders
        });
    } catch (error) {
        console.error(
            "Get orders error:",
            error
        );

        return res.status(500).json({
            message: "Unable to retrieve orders."
        });
    }
};

// ------------------------------------
// GET SINGLE CUSTOMER ORDER
// GET /api/orders/:id
// ------------------------------------

exports.getMyOrderById = async (req, res) => {
    try {
        if (
            !mongoose.isValidObjectId(req.params.id)
        ) {
            return res.status(400).json({
                message: "Invalid order ID."
            });
        }

        const order = await Order.findOne({
            _id: req.params.id,
            customerId: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found."
            });
        }

        return res.status(200).json({
            order
        });
    } catch (error) {
        console.error(
            "Get order error:",
            error
        );

        return res.status(500).json({
            message: "Unable to retrieve order."
        });
    }
};
