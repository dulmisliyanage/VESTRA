
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("../models/Product");

const imageFixes = [
    {
        name: "Satin Evening Blouse",
        image:
            "https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=900&q=85",
    },
    {
        name: "Pleated Midi Skirt",
        image:
            "https://images.unsplash.com/photo-1583496661160-fb5886a13d27?auto=format&fit=crop&w=900&q=85",
    },
];

async function fixProductImages() {
    try {
        const mongoURI =
            process.env.MONGO_URI ||
            process.env.MONGODB_URI ||
            process.env.MONGO_URL ||
            process.env.DATABASE_URL;

        if (!mongoURI) {
            throw new Error(
                "MongoDB connection string not found in .env"
            );
        }

        await mongoose.connect(mongoURI);
        console.log("MongoDB connected.");

        for (const product of imageFixes) {
            const result = await Product.updateOne(
                {
                    name: product.name,
                    "variants.sku": /^VST-DEMO-/,
                },
                {
                    $set: {
                        images: [product.image],
                    },
                }
            );

            if (result.matchedCount > 0) {
                console.log(`Updated: ${product.name}`);
            } else {
                console.log(`Not found: ${product.name}`);
            }
        }

        console.log("Image update completed.");
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

fixProductImages();
