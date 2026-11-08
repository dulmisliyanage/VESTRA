
require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");

async function makeAdmin() {
    try {
        const email = process.argv[2]?.trim().toLowerCase();

        if (!email) {
            throw new Error("Provide the email of an existing user");
        }

        await mongoose.connect(process.env.MONGO_URI);

        const user = await User.findOne({ email });

        if (!user) {
            throw new Error("User not found");
        }

        if (user.role !== "customer") {
            throw new Error("Only customer accounts can be promoted");
        }

        user.role = "admin";
        await user.save();

        console.log("Admin role assigned successfully");
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

makeAdmin();
