
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Store = require("../models/Store");

// Find the approved store owned by the logged-in seller
async function getSellerStore(userId) {
    return Store.findOne({
        ownerId: userId,
        approvalStatus: "approved"
    });
}

// Validate the important product fields
function validateProduct(data) {
    const {
        name,
        description,
        category,
        price,
        variants,
        images,
        status
    } = data;

    if (
        typeof name !== "string" ||
        !name.trim() ||
        name.length > 150
    ) {
        return "Valid product name is required";
    }

    if (
        typeof description !== "string" ||
        !description.trim() ||
        description.length > 3000
    ) {
        return "Valid description is required";
    }

    const categories = [
        "Men",
        "Women",
        "Unisex",
        "Accessories",
        "Footwear"
    ];

    if (!categories.includes(category)) {
        return "Invalid product category";
    }

    if (
        typeof price !== "number" ||
        !Number.isFinite(price) ||
        price < 0
    ) {
        return "Price must be a valid non-negative number";
    }

    if (
        !Array.isArray(variants) ||
        variants.length === 0 ||
        variants.length > 50
    ) {
        return "A product must have between 1 and 50 variants";
    }

    const skus = new Set();

    for (const variant of variants) {
        if (
            !variant ||
            typeof variant.size !== "string" ||
            !variant.size.trim() ||
            typeof variant.color !== "string" ||
            !variant.color.trim() ||
            typeof variant.sku !== "string" ||
            !variant.sku.trim() ||
            !Number.isInteger(variant.stock) ||
            variant.stock < 0
        ) {
            return "Each variant needs size, color, SKU and valid stock";
        }

        if (
            variant.size.trim().length > 30 ||
            variant.color.trim().length > 50 ||
            variant.sku.trim().length > 100 ||
            !Number.isSafeInteger(variant.stock)
        ) {
            return "Variant size, color, SKU or stock exceeds the allowed limits";
        }

        const sku = variant.sku.trim().toLowerCase();

        if (skus.has(sku)) {
            return "Variant SKUs must be unique within a product";
        }

        skus.add(sku);
    }

    if (images !== undefined) {
        if (!Array.isArray(images) || images.length > 5) {
            return "A product can have a maximum of 5 images";
        }

        for (const image of images) {
            if (
                typeof image !== "string" ||
                image.length > 2048 ||
                !/^https?:\/\/\S+$/i.test(image)
            ) {
                return "Images must contain valid HTTP(S) URLs";
            }
        }
    }

    if (
        status !== undefined &&
        !["draft", "active", "archived"].includes(status)
    ) {
        return "Invalid product status";
    }

    return null;
}

// CREATE PRODUCT
async function createProduct(req, res) {
    try {
        const store = await getSellerStore(req.user._id);

        if (!store) {
            return res.status(403).json({
                message: "You need an approved store"
            });
        }

        const error = validateProduct(req.body);

        if (error) {
            return res.status(400).json({ message: error });
        }

        const {
            name,
            description,
            category,
            price,
            images,
            variants,
            status
        } = req.body;

        const product = await Product.create({
            storeId: store._id,
            name: name.trim(),
            description: description.trim(),
            category,
            price,
            images: images || [],
            variants,
            status: status || "draft"
        });

        return res.status(201).json({
            message: "Product created successfully",
            product
        });
    } catch (error) {
        console.error("Create product:", error);
        return res.status(500).json({
            message: "Unable to create product"
        });
    }
}

// VIEW MY PRODUCTS
async function getMyProducts(req, res) {
    try {
        const store = await getSellerStore(req.user._id);

        if (!store) {
            return res.status(403).json({
                message: "Approved store required"
            });
        }

        const products = await Product.find({
            storeId: store._id
        }).sort({ createdAt: -1 });

        return res.json({ products });
    } catch (error) {
        console.error("Get products:", error);
        return res.status(500).json({
            message: "Unable to load products"
        });
    }
}

// VIEW SINGLE PRODUCT
async function getProduct(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Only publicly expose active products.
        // Drafts and archived products are visible to their owner.
        if (product.status !== "active") {
            let isOwner = false;

            if (req.user?.role === "seller") {
                const store = await getSellerStore(req.user._id);

                isOwner =
                    store &&
                    String(store._id) === String(product.storeId);
            }

            if (!isOwner) {
                return res.status(404).json({
                    message: "Product not found"
                });
            }
        }

        return res.json({ product });
    } catch (error) {
        console.error("Get product:", error);
        return res.status(500).json({
            message: "Unable to load product"
        });
    }
}

// UPDATE PRODUCT
async function updateProduct(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const store = await getSellerStore(req.user._id);

        if (!store) {
            return res.status(403).json({
                message: "Approved store required"
            });
        }

        const product = await Product.findOne({
            _id: req.params.id,
            storeId: store._id
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        const allowedFields = [
            "name",
            "description",
            "category",
            "price",
            "images",
            "variants",
            "status"
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        }

        const merged = {
            name: updates.name ?? product.name,
            description: updates.description ?? product.description,
            category: updates.category ?? product.category,
            price: updates.price ?? product.price,
            images: updates.images ?? product.images,
            variants: updates.variants ?? product.variants,
            status: updates.status ?? product.status
        };

        const error = validateProduct(merged);

        if (error) {
            return res.status(400).json({ message: error });
        }

        for (const [field, value] of Object.entries(updates)) {
            product[field] = value;
        }

        await product.save();

        return res.json({
            message: "Product updated successfully",
            product
        });
    } catch (error) {
        if (error.name === "VersionError") {
            return res.status(409).json({
                message:
                    "This product was changed while you were editing it. Please refresh the product and try again."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: error.message
            });
        }

        console.error("Update product:", error);

        return res.status(500).json({
            message: "Unable to update product"
        });
    }
}

// DELETE PRODUCT
async function deleteProduct(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const store = await getSellerStore(req.user._id);

        if (!store) {
            return res.status(403).json({
                message: "Approved store required"
            });
        }

        const product = await Product.findOneAndDelete({
            _id: req.params.id,
            storeId: store._id
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        return res.json({
            message: "Product deleted successfully"
        });
    } catch (error) {
        console.error("Delete product:", error);
        return res.status(500).json({
            message: "Unable to delete product"
        });
    }
}

async function getPublicProducts(req, res) {
    try {
        const allowedCategories = [
            "Men",
            "Women",
            "Unisex",
            "Accessories",
            "Footwear"
        ];

        const { category, search } = req.query;

        const page = Math.max(
            1,
            parseInt(req.query.page, 10) || 1
        );

        const limit = 12;

        const filter = {
            status: "active"
        };

        if (category && category !== "All") {
            if (!allowedCategories.includes(category)) {
                return res.status(400).json({
                    message: "Invalid category"
                });
            }

            filter.category = category;
        }

        if (typeof search === "string" && search.trim()) {
            const safeSearch = search
                .trim()
                .slice(0, 100)
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.name = {
                $regex: safeSearch,
                $options: "i"
            };
        }

        const [products, total] = await Promise.all([
            Product.find(filter)
                .select(
                    "name category price images variants storeId createdAt"
                )
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            Product.countDocuments(filter)
        ]);

        return res.status(200).json({
            products,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Public product error:", error);

        return res.status(500).json({
            message: "Unable to load products"
        });
    }
}


async function getMyProductById(req, res) {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const store = await getSellerStore(req.user._id);

        if (!store) {
            return res.status(403).json({
                message: "Approved store required"
            });
        }

        const product = await Product.findOne({
            _id: req.params.id,
            storeId: store._id
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        return res.json({ product });
    } catch (error) {
        console.error("Get seller product:", error);

        return res.status(500).json({
            message: "Unable to load product"
        });
    }
}



module.exports = {
    createProduct,
    getMyProducts,
    getProduct,
    updateProduct,
    deleteProduct,
    getPublicProducts
};
