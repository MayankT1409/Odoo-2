const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');
const Review = require('../models/Review');
const { auth, optionalAuth } = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `avatar_${req.user.id}_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Avatar upload endpoint
router.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Return full URL for avatar
    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl });
    res.json({ success: true, avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ success: false, message: 'Server error during avatar upload' });
  }
});

// Get all public users with optional filtering
router.get('/', optionalAuth, [
    query('search').optional().trim().escape(),
    query('skillsOffered').optional(),
    query('skillsWanted').optional(),
    query('location').optional().trim().escape(),
    query('availability').optional().isIn(['Weekdays', 'Evenings', 'Weekends', 'Flexible']),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('sortBy').optional().isIn(['rating', 'name', 'createdAt', 'lastLogin']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: errors.array()
            });
        }

        const {
            search,
            skillsOffered,
            skillsWanted,
            location,
            availability,
            minRating,
            page = 1,
            limit = 12,
            sortBy = 'rating',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = {
            isPublic: true,
            isActive: true
        };

        // Exclude current user if authenticated
        if (req.user) {
            query._id = { $ne: req.user.id };
        }

        // Search filters
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { bio: { $regex: search, $options: 'i' } },
                { skillsOffered: { $regex: search, $options: 'i' } },
                { skillsWanted: { $regex: search, $options: 'i' } }
            ];
        }

        if (skillsOffered) {
            const skills = Array.isArray(skillsOffered) ? skillsOffered : [skillsOffered];
            query.skillsOffered = { $in: skills };
        }

        if (skillsWanted) {
            const skills = Array.isArray(skillsWanted) ? skillsWanted : [skillsWanted];
            query.skillsWanted = { $in: skills };
        }

        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }

        if (availability) {
            query.availability = availability;
        }

        if (minRating) {
            query.rating = { $gte: parseFloat(minRating) };
        }

        // Sorting
        const sortOptions = {};
        if (sortBy === 'name') {
            sortOptions.name = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'createdAt') {
            sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
        } else if (sortBy === 'lastLogin') {
            sortOptions.lastLoginAt = sortOrder === 'asc' ? 1 : -1;
        } else {
            sortOptions.rating = sortOrder === 'asc' ? 1 : -1;
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Execute query
        const users = await User.find(query)
            .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires -preferences.emailNotifications')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean();

        // Get total count for pagination
        const total = await User.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    current: page,
                    pages: totalPages,
                    total,
                    limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                filters: {
                    search,
                    skillsOffered,
                    skillsWanted,
                    location,
                    availability,
                    minRating
                }
            }
        });

    } catch (err) {
        console.error('Get users error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
});

// Get user profile by ID
router.get('/:userId', optionalAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check privacy settings
        if (!user.isPublic && (!req.user || req.user.id !== userId)) {
            return res.status(403).json({
                success: false,
                message: 'This profile is private'
            });
        }

        if (!user.isActive) {
            return res.status(404).json({
                success: false,
                message: 'User account is not active'
            });
        }

        // Get additional profile data
        const [reviews, swapStats] = await Promise.all([
            Review.find({ 
                reviewee: userId, 
                isPublic: true, 
                isHidden: false 
            })
            .populate('reviewer', 'name avatar')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
            
            SwapRequest.getUserStats(userId)
        ]);

        // Remove sensitive info if not own profile or admin
        let profileData = user.toJSON();
        if (!req.user || (req.user.id !== userId && req.user.role !== 'admin')) {
            delete profileData.preferences.emailNotifications;
            delete profileData.socialLinks;
        }

        res.json({
            success: true,
            data: {
                user: profileData,
                reviews,
                stats: swapStats[0] || {
                    totalRequests: 0,
                    pendingRequests: 0,
                    acceptedRequests: 0,
                    completedRequests: 0,
                    rejectedRequests: 0,
                    cancelledRequests: 0
                }
            }
        });

    } catch (err) {
        console.error('Get user profile error:', err);
        
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while fetching user profile'
        });
    }
});

// Update user profile
router.put('/:userId', auth, [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),
    body('location')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Location cannot exceed 100 characters'),
    body('skillsOffered')
        .optional()
        .isArray()
        .withMessage('Skills offered must be an array'),
    body('skillsWanted')
        .optional()
        .isArray()
        .withMessage('Skills wanted must be an array'),
    body('availability')
        .optional()
        .isIn(['Weekdays', 'Evenings', 'Weekends', 'Flexible'])
        .withMessage('Invalid availability option'),
    body('preferredLearningMode')
        .optional()
        .isIn(['Online', 'In-Person', 'Both'])
        .withMessage('Invalid learning mode'),
    body('languages')
        .optional()
        .isArray()
        .withMessage('Languages must be an array'),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('isPublic must be a boolean'),
    body('socialLinks.linkedin')
        .optional()
        .isURL()
        .withMessage('LinkedIn URL must be valid'),
    body('socialLinks.github')
        .optional()
        .isURL()
        .withMessage('GitHub URL must be valid'),
    body('socialLinks.portfolio')
        .optional()
        .isURL()
        .withMessage('Portfolio URL must be valid')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated via this route
        delete updateData.password;
        delete updateData.email;
        delete updateData.role;
        delete updateData.isActive;
        delete updateData.isEmailVerified;
        delete updateData.rating;
        delete updateData.reviewsCount;
        delete updateData.stats;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: user.toJSON() }
        });

    } catch (err) {
        console.error('Update profile error:', err);
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while updating profile'
        });
    }
});

// Find users with complementary skills
router.get('/:userId/matches', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 10 } = req.query;

        // Ensure user is accessing their own matches or is admin
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const matches = await User.findComplementaryUsers(
            userId,
            user.skillsWanted,
            user.skillsOffered
        ).limit(parseInt(limit));

        res.json({
            success: true,
            data: {
                matches,
                total: matches.length,
                userSkills: {
                    offered: user.skillsOffered,
                    wanted: user.skillsWanted
                }
            }
        });

    } catch (err) {
        console.error('Find matches error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while finding matches'
        });
    }
});

// Get user's swap requests
router.get('/:userId/swaps', auth, [
    query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']),
    query('type').optional().isIn(['sent', 'received', 'all']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid query parameters',
                errors: errors.array()
            });
        }

        const { userId } = req.params;
        const { 
            status, 
            type = 'all', 
            page = 1, 
            limit = 10 
        } = req.query;

        let query = {};

        // Build query based on type
        if (type === 'sent') {
            query.requester = userId;
        } else if (type === 'received') {
            query.recipient = userId;
        } else {
            query.$or = [
                { requester: userId },
                { recipient: userId }
            ];
        }

        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const swaps = await SwapRequest.find(query)
            .populate('requester', 'name avatar rating')
            .populate('recipient', 'name avatar rating')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await SwapRequest.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                swaps,
                pagination: {
                    current: page,
                    pages: totalPages,
                    total,
                    limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });

    } catch (err) {
        console.error('Get user swaps error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching swaps'
        });
    }
});

// Get user's reviews
router.get('/:userId/reviews', [
    query('type').optional().isIn(['received', 'given', 'all']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt()
], async (req, res) => {
    try {
        const { userId } = req.params;
        const { 
            type = 'received', 
            page = 1, 
            limit = 10 
        } = req.query;

        let query = {
            isPublic: true,
            isHidden: false
        };

        if (type === 'received') {
            query.reviewee = userId;
        } else if (type === 'given') {
            query.reviewer = userId;
        } else {
            query.$or = [
                { reviewee: userId },
                { reviewer: userId }
            ];
        }

        const skip = (page - 1) * limit;

        const reviews = await Review.find(query)
            .populate('reviewer', 'name avatar')
            .populate('reviewee', 'name avatar')
            .populate('swapRequest', 'skillOffered skillWanted')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Review.countDocuments(query);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                reviews,
                pagination: {
                    current: page,
                    pages: totalPages,
                    total,
                    limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });

    } catch (err) {
        console.error('Get user reviews error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching reviews'
        });
    }
});

// Deactivate user account
router.delete('/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: false },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'Account deactivated successfully'
        });

    } catch (err) {
        console.error('Deactivate account error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while deactivating account'
        });
    }
});

module.exports = router;