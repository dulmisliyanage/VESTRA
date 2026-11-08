
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/Product");
const Store = require("../models/Store");

// ========================================
// VESTRA SAMPLE PRODUCT DATA
// ========================================

// These are demo products for development.
// Prices are illustrative, in Sri Lankan Rupees.

// Sample images from Unsplash.
// Replace with your own licensed product photos
// before launching a real marketplace.

const sampleProducts = [
    // ================= MEN =================
    {
        name: "Essential Oversized T-Shirt",
        category: "Men",
        price: 3900,
        imageId: "photo-1521572163474-6864f9cf17ab",
        sizes: ["S", "M", "L", "XL"],
        color: "Black"
    },
    {
        name: "Classic Oxford Shirt",
        category: "Men",
        price: 6500,
        imageId: "photo-1598032895397-b9472444bf93",
        sizes: ["M", "L", "XL"],
        color: "White"
    },
    {
        name: "Relaxed Linen Shirt",
        category: "Men",
        price: 7200,
        imageId: "photo-1603252109303-2751441dd157",
        sizes: ["S", "M", "L", "XL"],
        color: "Beige"
    },
    {
        name: "Tailored Chino Trousers",
        category: "Men",
        price: 8500,
        imageId: "photo-1473966968600-fa801b869a1a",
        sizes: ["30", "32", "34", "36"],
        color: "Khaki"
    },
    {
        name: "Minimal Crewneck Sweatshirt",
        category: "Men",
        price: 5900,
        imageId: "photo-1578681994506-b8f463449011",
        sizes: ["S", "M", "L", "XL"],
        color: "Grey"
    },
    {
        name: "Straight Fit Denim Jeans",
        category: "Men",
        price: 8900,
        imageId: "photo-1542272604-787c3835535d",
        sizes: ["30", "32", "34", "36"],
        color: "Blue"
    },

    // ================= WOMEN =================
    {
        name: "Elegant Linen Midi Dress",
        category: "Women",
        price: 9900,
        imageId: "photo-1515372039744-b8f02a3ae446",
        sizes: ["XS", "S", "M", "L"],
        color: "Cream"
    },
    {
        name: "Classic Tailored Blazer",
        category: "Women",
        price: 14500,
        imageId: "photo-1591047139829-d91aecb6caea",
        sizes: ["S", "M", "L"],
        color: "Beige"
    },
    {
        name: "Satin Evening Blouse",
        category: "Women",
        price: 6800,
        imageId: "photo-1564257577-7cadc8e7d7e5",
        sizes: ["XS", "S", "M", "L"],
        color: "Ivory"
    },
    {
        name: "Pleated Midi Skirt",
        category: "Women",
        price: 7200,
        imageId: "photo-1583496661160-fb5886a13d27",
        sizes: ["S", "M", "L"],
        color: "Black"
    },
    {
        name: "Everyday Cotton Top",
        category: "Women",
        price: 3500,
        imageId: "photo-1554568218-0f1715e72254",
        sizes: ["XS", "S", "M", "L"],
        color: "White"
    },
    {
        name: "Relaxed Wide Leg Trousers",
        category: "Women",
        price: 7900,
        imageId: "photo-1594633312681-425c7b97ccd1",
        sizes: ["S", "M", "L", "XL"],
        color: "Sand"
    },

    // ================= UNISEX =================
    {
        name: "Signature VESTRA Hoodie",
        category: "Unisex",
        price: 8500,
        imageId: "photo-1556821840-3a63f95609a7",
        sizes: ["S", "M", "L", "XL"],
        color: "Black"
    },
    {
        name: "Premium Basic T-Shirt",
        category: "Unisex",
        price: 4200,
        imageId: "photo-1503341504253-dff4815485f1",
        sizes: ["S", "M", "L", "XL"],
        color: "White"
    },
    {
        name: "Relaxed Denim Jacket",
        category: "Unisex",
        price: 12900,
        imageId: "photo-1544923246-77307dd654cb",
        sizes: ["S", "M", "L", "XL"],
        color: "Blue"
    },
    {
        name: "Essential Zip-Up Jacket",
        category: "Unisex",
        price: 11500,
        imageId: "photo-1551028719-00167b16eac5",
        sizes: ["S", "M", "L", "XL"],
        color: "Black"
    },

    // ================= ACCESSORIES =================
    {
        name: "Minimal Leather Crossbody Bag",
        category: "Accessories",
        price: 8900,
        imageId: "photo-1548036328-c9fa89d128fa",
        sizes: ["One Size"],
        color: "Brown"
    },
    {
        name: "Classic Leather Belt",
        category: "Accessories",
        price: 3900,
        imageId: "photo-1624222247344-550fb60583dc",
        sizes: ["M", "L", "XL"],
        color: "Black"
    },
    {
        name: "Everyday Canvas Tote Bag",
        category: "Accessories",
        price: 2900,
        imageId: "photo-1590874103328-eac38a683ce7",
        sizes: ["One Size"],
        color: "Natural"
    },
    {
        name: "Classic Cotton Baseball Cap",
        category: "Accessories",
        price: 3200,
        imageId: "photo-1588850561407-ed78c282e89b",
        sizes: ["One Size"],
        color: "Black"
    },

    // ================= FOOTWEAR =================
    {
        name: "Minimal White Sneakers",
        category: "Footwear",
        price: 12500,
        imageId: "photo-1549298916-b41d501d3772",
        sizes: ["39", "40", "41", "42", "43"],
        color: "White"
    },
    {
        name: "Classic Leather Loafers",
        category: "Footwear",
        price: 15900,
        imageId: "photo-1614252235316-8c857d38b5f4",
        sizes: ["39", "40", "41", "42", "43"],
        color: "Brown"
    },
    {
        name: "Everyday Canvas Sneakers",
        category: "Footwear",
        price: 7900,
        imageId: "photo-1525966222134-fcfa99b8ae77",
        sizes: ["38", "39", "40", "41", "42"],
        color: "Black"
    },
    {
        name: "Minimal Slide Sandals",
        category: "Footwear",
        price: 5900,
        imageId: "photo-1603487742131-4160ec999306",
        sizes: ["38", "39", "40", "41", "42"],
        color: "Beige"
    }
];

// ========================================
// BUILD PRODUCT DOCUMENT
// ========================================

function buildProduct(item, index, storeId) {
    const variants = item.sizes.map((size, sizeIndex) => ({
        size,
        color: item.color,
        sku: `VST-DEMO-${String(index + 1).padStart(3, "0")}-${String(sizeIndex + 1).padStart(2, "0")}`,
        stock: 10 + sizeIndex * 3
    }));

    return {
        storeId,
        name: item.name,
        description:
            `${item.name} is part of the VESTRA demo fashion collection. ` +
            `Designed for everyday style, comfort, and versatility. ` +
            `This is a sample product for development and testing.`,
        category: item.category,
        price: item.price,
        images: [
            `https://images.unsplash.com/${item.imageId}?auto=format&fit=crop&w=900&q=85`
        ],
        variants,
        status: "active"
    };
}

// ========================================
// SEED PRODUCTS
// ========================================

async function seedProducts() {
    try {
        const mongoURI =
            process.env.MONGO_URI ||
            process.env.MONGODB_URI ||
            process.env.MONGO_URL ||
            process.env.DATABASE_URL;

        if (!mongoURI || typeof mongoURI !== "string") {
            throw new Error(
                "MongoDB connection string not found. Check the variable name in server/.env."
            );
        }

        await mongoose.connect(mongoURI);

        console.log("MongoDB connected.");

        // Select an approved store.
        // Optionally set SEED_STORE_ID in .env to target
        // a specific approved seller store.
        const storeQuery = {
            approvalStatus: "approved"
        };

        if (process.env.SEED_STORE_ID) {
            if (!mongoose.isValidObjectId(process.env.SEED_STORE_ID)) {
                throw new Error("SEED_STORE_ID is not a valid ObjectId.");
            }

            storeQuery._id = process.env.SEED_STORE_ID;
        }

        const store = await Store.findOne(storeQuery);

        if (!store) {
            throw new Error(
                "No approved seller store found. Approve a store first."
            );
        }

        console.log(`Using store: ${store.storeName}`);

        // Only manage products created by this demo script.
        // Never delete manually created products.
        const demoSkuPrefix = /^VST-DEMO-/;

        const existingDemoProducts = await Product.find({
            storeId: store._id,
            "variants.sku": demoSkuPrefix
        }).select("name variants");

        const existingDemoSkus = new Set(
            existingDemoProducts.flatMap((product) =>
                product.variants.map((variant) => variant.sku)
            )
        );

        const productsToInsert = sampleProducts
            .map((item, index) =>
                buildProduct(item, index, store._id)
            )
            .filter(
                (product) =>
                    !product.variants.some((variant) =>
                        existingDemoSkus.has(variant.sku)
                    )
            );

        if (productsToInsert.length === 0) {
            console.log(
                "All demo products already exist. Nothing to insert."
            );
            return;
        }

        const inserted = await Product.insertMany(
            productsToInsert,
            { ordered: true }
        );

        console.log(
            `Successfully inserted ${inserted.length} demo products.`
        );

        console.log(
            "Open http://localhost:5173/shop to view them."
        );
    } catch (error) {
        console.error("Product seeding failed:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

seedProducts();
