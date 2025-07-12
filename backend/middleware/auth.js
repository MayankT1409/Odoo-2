const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Basic auth middleware
const authMiddleware = async (req, res, next) => {
    try {
        // Extract token from header
        const authHeader = req.header("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided, authorization denied"
            });
        }

        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Find user and check if still active
        const user = await User.findById(decoded.id).select("-password");
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found, token invalid"
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Account is deactivated"
            });
        }

        // Attach user ID to request (maintain compatibility with existing code)
        req.user = decoded.id;
        req.userDetails = user;
        
        next();
    } catch (err) {
        console.error("Auth middleware error:", err.message);
        
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            });
        }
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: "Token expired"
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error in authentication"
        });
    }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            req.user = null;
            req.userDetails = null;
            return next();
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.id).select("-password");
        
        if (user && user.isActive) {
            req.user = decoded.id;
            req.userDetails = user;
        } else {
            req.user = null;
            req.userDetails = null;
        }
        
        next();
    } catch (err) {
        // If token is invalid, just continue without user
        req.user = null;
        req.userDetails = null;
        next();
    }
};

// Admin auth middleware
const adminAuth = async (req, res, next) => {
    try {
        // First run basic auth
        await new Promise((resolve, reject) => {
            authMiddleware(req, res, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        // Check if user is admin
        if (!req.userDetails || req.userDetails.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin privileges required."
            });
        }

        next();
    } catch (err) {
        console.error("Admin auth error:", err);
        // Don't send response if headers already sent
        if (!res.headersSent) {
            res.status(401).json({
                success: false,
                message: "Authentication failed"
            });
        }
    }
};

module.exports = authMiddleware;

// Also export additional middleware for routes that need them
module.exports.auth = authMiddleware;
module.exports.optionalAuth = optionalAuth;
module.exports.adminAuth = adminAuth;