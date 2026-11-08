
const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function protect(req, res, next) {
    try {
        const token = req.cookies?.vestra_token;

        if (!token) {
            return res.status(401).json({
                message: "Please log in first"
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ["HS256"] }
        );

        const user = await User.findById(decoded.id);

        if (!user || user.status !== "active") {
            return res.status(401).json({
                message: "Invalid account"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({
            message: "Invalid or expired session"
        });
    }
}

function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
}

module.exports = { protect, authorize };
