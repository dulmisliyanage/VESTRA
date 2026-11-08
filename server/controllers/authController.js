
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");


const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/"
};


function publicUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
    };
}

function createSession(res, user) {
    const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET,
        { expiresIn: "1d", algorithm: "HS256" }
    );

    res.cookie("vestra_token", token, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000
    });
}

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            name.trim().length > 80 ||
            typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            typeof password !== "string" ||
            password.length < 12 ||
            Buffer.byteLength(password, "utf8") > 72
        ) {
            return res.status(400).json({
                message: "Enter valid details and a password of at least 12 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            role: "customer"
        });

        createSession(res, user);

        return res.status(201).json({
            message: "Registration successful",
            user: publicUser(user)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        console.error(error);
        return res.status(500).json({
            message: "Registration failed"
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const user = await User.findOne({
            email: email.trim().toLowerCase()
        }).select("+passwordHash");

        if (
            !user ||
            user.status !== "active" ||
            !(await bcrypt.compare(password, user.passwordHash))
        ) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        createSession(res, user);

        return res.json({
            message: "Login successful",
            user: publicUser(user)
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Login failed"
        });
    }
}

function getMe(req, res) {
    return res.json({
        user: publicUser(req.user)
    });
}

function logout(req, res) {
    res.clearCookie("vestra_token", cookieOptions);

    return res.json({
        message: "Logged out successfully"
    });
}

module.exports = {
    register,
    login,
    getMe,
    logout
};
