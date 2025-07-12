const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

// Signup Route for SkillSwap
router.post('/signup', [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('skillsOffered')
        .optional()
        .isArray()
        .withMessage('Skills offered must be an array'),
    body('skillsWanted')
        .optional()
        .isArray()
        .withMessage('Skills wanted must be an array'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location cannot exceed 100 characters'),
    body('availability')
        .optional()
        .isIn(['Weekdays', 'Evenings', 'Weekends', 'Flexible'])
        .withMessage('Invalid availability option')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { 
            name, 
            email, 
            password, 
            skillsOffered = [],
            skillsWanted = [],
            location = '',
            availability = 'Flexible',
            bio = '',
            preferredLearningMode = 'Both',
            languages = []
        } = req.body;

        // Check if user already exists
        let existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Check if this is the first user (make them admin)
        const userCount = await User.countDocuments();
        const isFirstUser = userCount === 0;
        const isAdminEmail = email.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();

        // Create new user
        const user = new User({
            name,
            email: email.toLowerCase(),
            password,
            skillsOffered,
            skillsWanted,
            location,
            availability,
            bio,
            preferredLearningMode,
            languages,
            role: (isFirstUser || isAdminEmail) ? 'admin' : 'user',
            isEmailVerified: (isFirstUser || isAdminEmail) // Auto-verify admin
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id);

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        console.log(`✅ New user registered: ${user.email} (Role: ${user.role})`);

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: user.toJSON()
        });

    } catch (err) {
        console.error('Signup error:', err);
        
        // Handle validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

// Login Route
router.post('/login', [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ 
            email: email.toLowerCase(),
            isActive: true 
        });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check password using the model method
        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        console.log(`✅ User logged in: ${user.email}`);
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: user.toJSON()
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

// Get current user (protected route)
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user).select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user: user.toJSON()
        });

    } catch (err) {
        console.error('Get current user error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Logout Route (optional - mainly for clearing client-side token)
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
});

// Refresh Token Route
router.post('/refresh', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Generate new token
        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            token,
            user: user.toJSON()
        });

    } catch (err) {
        console.error('Token refresh error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error during token refresh'
        });
    }
});

module.exports = router;