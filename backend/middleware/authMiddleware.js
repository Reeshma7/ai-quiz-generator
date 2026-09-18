const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        // Get Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Not authorized. Please login."
            });
        }

        // Check Bearer token
        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Not authorized. Invalid authorization format."
            });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Not authorized. Token missing."
            });
        }

        // Check JWT secret
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing in .env");

            return res.status(500).json({
                message: "JWT secret is not configured on the server."
            });
        }

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Make sure token contains userId
        if (!decoded.userId) {
            return res.status(401).json({
                message: "Invalid token. User information missing."
            });
        }

        // Find user
        const user = await User.findById(
            decoded.userId
        ).select("-password");

        if (!user) {
            return res.status(401).json({
                message: "User associated with this token was not found."
            });
        }

        // Store logged-in user
        req.user = user;

        next();

    } catch (error) {

        console.error(
            "Authentication middleware error:",
            error.message
        );

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Your session has expired. Please login again."
            });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Invalid authentication token. Please login again."
            });
        }

        return res.status(401).json({
            message: "Authentication failed. Please login again."
        });
    }
};

module.exports = protect;