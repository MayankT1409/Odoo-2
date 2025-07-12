const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create new user - password hashing is handled by the User model pre-save middleware
        user = new User({
            name,
            email: email.toLowerCase(),
            password
        });

        await user.save();
        res.status(201).json({ msg: 'Signup successful! Please log in.' });
    } catch (err) {
        console.error('Signup error:', err);
        
        // Handle validation errors
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({ msg: messages.join(', ') });
        }
        
        res.status(500).json({ msg: 'Server error' });
    }
});

// Login Route with detailed debugging
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Log the login attempt
        console.log("Login attempt:", { email });
        
        // Validate inputs
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please provide email and password' });
        }

        // Find user by email (case insensitive)
        const user = await User.findOne({ email: email.toLowerCase() });
        
        // Check if user exists
        if (!user) {
            console.log('User not found with email:', email);
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        console.log('User found:', user.email);
        console.log('Stored password hash:', user.password.substring(0, 15) + '...');

        // Direct password comparison using bcrypt (not using the model method)
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('Password does not match for user:', email);
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        console.log('Login successful for:', email);
        
        // Return user data and token
        res.json({
            msg: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;