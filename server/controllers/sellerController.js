
const Store = require("../models/Store");

// Generate a URL-friendly store name
function makeSlug(name) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

// POST: Apply to become a seller
async function applyForSeller(req, res) {
    try {
        const { storeName, description } = req.body;

        // Validate input
        if (
            typeof storeName !== "string" ||
            storeName.trim().length < 3 ||
            storeName.trim().length > 80 ||
            (description !== undefined &&
                (typeof description !== "string" ||
                    description.length > 1000))
        ) {
            return res.status(400).json({
                message: "Enter a valid store name and description"
            });
        }

        // Check if user already has a store
        const existingStore = await Store.findOne({
            ownerId: req.user._id
        });

        if (existingStore) {
            return res.status(409).json({
                message: "You already have a store application"
            });
        }

        // Generate store slug
        const slug = makeSlug(storeName);

        if (!slug) {
            return res.status(400).json({
                message: "Store name must contain letters or numbers"
            });
        }

        // Check if store name is taken
        const slugExists = await Store.findOne({ slug });

        if (slugExists) {
            return res.status(409).json({
                message: "This store name is already taken"
            });
        }

        // Create store application
        const store = await Store.create({
            ownerId: req.user._id,
            storeName: storeName.trim(),
            slug,
            description: description?.trim() || "",
            approvalStatus: "pending"
        });

        return res.status(201).json({
            message: "Seller application submitted successfully",
            store
        });

    } catch (error) {
        // Handle duplicate store or owner
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Store name or application already exists"
            });
        }

        console.error("Seller application error:", error);

        return res.status(500).json({
            message: "Unable to submit application"
        });
    }
}

// GET: View current user's store
async function getMyStore(req, res) {
    try {
        const store = await Store.findOne({
            ownerId: req.user._id
        });

        return res.status(200).json({
            store
        });

    } catch (error) {
        console.error("Get store error:", error);

        return res.status(500).json({
            message: "Unable to load store"
        });
    }
}

// Export controller functions
module.exports = {
    applyForSeller,
    getMyStore
};
