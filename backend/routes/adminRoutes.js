const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');
const Review = require('../models/Review');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Get admin dashboard statistics
router.get('/dashboard', adminAuth, async (req, res) => {
    try {
        const [
            totalUsers,
            activeUsers,
            totalSwaps,
            pendingSwaps,
            completedSwaps,
            totalReviews,
            recentUsers,
            recentSwaps,
            userGrowth,
            swapTrends
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isActive: true }),
            SwapRequest.countDocuments(),
            SwapRequest.countDocuments({ status: 'pending' }),
            SwapRequest.countDocuments({ status: 'completed' }),
            Review.countDocuments(),
            
            // Recent users (last 30 days)
            User.find({ 
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }).countDocuments(),
            
            // Recent swaps (last 30 days)
            SwapRequest.find({ 
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }).countDocuments(),
            
            // User growth by month (last 6 months)
            User.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            
            // Swap trends by status
            SwapRequest.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        // Get average ratings
        const avgUserRating = await User.aggregate([
            { $match: { rating: { $gt: 0 } } },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        // Get most popular skills
        const popularSkills = await User.aggregate([
            { $unwind: '$skillsOffered' },
            { $group: { _id: '$skillsOffered', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalUsers,
                    activeUsers,
                    totalSwaps,
                    pendingSwaps,
                    completedSwaps,
                    totalReviews,
                    recentUsers,
                    recentSwaps,
                    averageRating: avgUserRating[0]?.avgRating || 0,
                    successRate: totalSwaps > 0 ? Math.round((completedSwaps / totalSwaps) * 100) : 0
                },
                trends: {
                    userGrowth,
                    swapTrends,
                    popularSkills
                }
            }
        });

    } catch (err) {
        console.error('Get admin dashboard error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching dashboard data'
        });
    }
});

// Get all users (with advanced filtering and pagination)
router.get('/users', adminAuth, [
    query('search').optional().trim().escape(),
    query('role').optional().isIn(['user', 'admin']),
    query('isActive').optional().isBoolean().toBoolean(),
    query('isEmailVerified').optional().isBoolean().toBoolean(),
    query('minRating').optional().isFloat({ min: 0, max: 5 }),
    query('dateFrom').optional().isISO8601().toDate(),
    query('dateTo').optional().isISO8601().toDate(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isIn(['name', 'email', 'createdAt', 'lastLoginAt', 'rating']),
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
            role,
            isActive,
            isEmailVerified,
            minRating,
            dateFrom,
            dateTo,
            page = 1,
            limit = 25,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        if (role) query.role = role;
        if (typeof isActive === 'boolean') query.isActive = isActive;
        if (typeof isEmailVerified === 'boolean') query.isEmailVerified = isEmailVerified;
        if (minRating) query.rating = { $gte: minRating };

        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = dateFrom;
            if (dateTo) query.createdAt.$lte = dateTo;
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;

        const users = await User.find(query)
            .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit)
            .lean();

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
                }
            }
        });

    } catch (err) {
        console.error('Get admin users error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching users'
        });
    }
});

// Update user (admin can modify any field)
router.put('/users/:userId', adminAuth, [
    body('name').optional().trim().isLength({ min: 2, max: 50 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['user', 'admin']),
    body('isActive').optional().isBoolean(),
    body('isEmailVerified').optional().isBoolean(),
    body('isPublic').optional().isBoolean()
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

        // Don't allow password updates through this route
        delete updateData.password;

        // Check if email is already taken (if email is being updated)
        if (updateData.email) {
            const existingUser = await User.findOne({ 
                email: updateData.email, 
                _id: { $ne: userId } 
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

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
            message: 'User updated successfully',
            data: { user }
        });

    } catch (err) {
        console.error('Admin update user error:', err);
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        if (err.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while updating user'
        });
    }
});

// Delete user
router.delete('/users/:userId', adminAuth, async (req, res) => {
    try {
        const { userId } = req.params;

        // Don't allow admin to delete themselves
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Also clean up related data
        await Promise.all([
            SwapRequest.deleteMany({
                $or: [{ requester: userId }, { recipient: userId }]
            }),
            Review.deleteMany({
                $or: [{ reviewer: userId }, { reviewee: userId }]
            })
        ]);

        res.json({
            success: true,
            message: 'User and related data deleted successfully'
        });

    } catch (err) {
        console.error('Admin delete user error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting user'
        });
    }
});

// Ban/Unban user
router.put('/users/:userId/ban', adminAuth, [
    body('isBanned').isBoolean(),
    body('banReason').optional().trim().isLength({ min: 1, max: 500 })
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
        const { isBanned, banReason } = req.body;

        // Don't allow admin to ban themselves
        if (userId === req.user) {
            return res.status(400).json({
                success: false,
                message: 'Cannot ban your own account'
            });
        }

        const updateData = {
            isActive: !isBanned
        };

        if (isBanned) {
            updateData.banReason = banReason;
            updateData.bannedAt = new Date();
            updateData.bannedBy = req.user;
        } else {
            updateData.banReason = null;
            updateData.bannedAt = null;
            updateData.bannedBy = null;
        }

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
            message: isBanned ? 'User banned successfully' : 'User unbanned successfully',
            data: { user }
        });

    } catch (err) {
        console.error('Admin ban user error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while updating user ban status'
        });
    }
});

// Get all swap requests
router.get('/swaps', adminAuth, [
    query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('dateFrom').optional().isISO8601().toDate(),
    query('dateTo').optional().isISO8601().toDate(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isIn(['createdAt', 'responseBy', 'priority']),
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
            status,
            priority,
            dateFrom,
            dateTo,
            page = 1,
            limit = 25,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        if (status) query.status = status;
        if (priority) query.priority = priority;

        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = dateFrom;
            if (dateTo) query.createdAt.$lte = dateTo;
        }

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;

        const swaps = await SwapRequest.find(query)
            .populate('requester', 'name email avatar rating')
            .populate('recipient', 'name email avatar rating')
            .sort(sortOptions)
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
        console.error('Get admin swaps error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching swaps'
        });
    }
});

// Update swap request status (admin override)
router.put('/swaps/:swapId', adminAuth, [
    body('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    body('adminNotes').optional().trim().isLength({ max: 1000 })
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

        const { swapId } = req.params;
        const { status, priority, adminNotes } = req.body;

        const updateData = {};
        if (status) {
            updateData.status = status;
            updateData[`${status}At`] = new Date();
        }
        if (priority) updateData.priority = priority;
        if (adminNotes) updateData.adminNotes = adminNotes;

        const swapRequest = await SwapRequest.findByIdAndUpdate(
            swapId,
            { $set: updateData },
            { new: true }
        ).populate('requester', 'name email avatar')
          .populate('recipient', 'name email avatar');

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                message: 'Swap request not found'
            });
        }

        res.json({
            success: true,
            message: 'Swap request updated successfully',
            data: { swapRequest }
        });

    } catch (err) {
        console.error('Admin update swap error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while updating swap'
        });
    }
});

// Delete swap request
router.delete('/swaps/:swapId', adminAuth, async (req, res) => {
    try {
        const { swapId } = req.params;

        const swapRequest = await SwapRequest.findByIdAndDelete(swapId);

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                message: 'Swap request not found'
            });
        }

        // Also delete related reviews
        await Review.deleteMany({ swapRequest: swapId });

        res.json({
            success: true,
            message: 'Swap request and related reviews deleted successfully'
        });

    } catch (err) {
        console.error('Admin delete swap error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting swap'
        });
    }
});

// Get all reviews
router.get('/reviews', adminAuth, [
    query('isPublic').optional().isBoolean().toBoolean(),
    query('isHidden').optional().isBoolean().toBoolean(),
    query('minRating').optional().isInt({ min: 1, max: 5 }),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sortBy').optional().isIn(['createdAt', 'rating.overall']),
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
            isPublic,
            isHidden,
            minRating,
            page = 1,
            limit = 25,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        let query = {};

        if (typeof isPublic === 'boolean') query.isPublic = isPublic;
        if (typeof isHidden === 'boolean') query.isHidden = isHidden;
        if (minRating) query['rating.overall'] = { $gte: minRating };

        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;

        const reviews = await Review.find(query)
            .populate('reviewer', 'name email avatar')
            .populate('reviewee', 'name email avatar')
            .populate('swapRequest', 'skillOffered skillWanted status')
            .sort(sortOptions)
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
        console.error('Get admin reviews error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching reviews'
        });
    }
});

// Hide/unhide review
router.put('/reviews/:reviewId/visibility', adminAuth, [
    body('isHidden').isBoolean().withMessage('isHidden must be a boolean')
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

        const { reviewId } = req.params;
        const { isHidden } = req.body;

        const review = await Review.findByIdAndUpdate(
            reviewId,
            { isHidden },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.json({
            success: true,
            message: `Review ${isHidden ? 'hidden' : 'unhidden'} successfully`,
            data: { review }
        });

    } catch (err) {
        console.error('Admin update review visibility error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while updating review visibility'
        });
    }
});

// Get platform analytics
router.get('/analytics', adminAuth, [
    query('period').optional().isIn(['7d', '30d', '90d', '365d'])
], async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        const days = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '365d': 365
        };

        const startDate = new Date(Date.now() - days[period] * 24 * 60 * 60 * 1000);

        const [
            userGrowth,
            swapTrends,
            skillPopularity,
            reviewTrends,
            locationData,
            userActivity
        ] = await Promise.all([
            // User registration over time
            User.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // Swap requests over time
            SwapRequest.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            status: '$status'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.date': 1 } }
            ]),

            // Most popular skills
            User.aggregate([
                { $unwind: '$skillsOffered' },
                { $group: { _id: '$skillsOffered', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 20 }
            ]),

            // Reviews over time
            Review.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        count: { $sum: 1 },
                        avgRating: { $avg: '$rating.overall' }
                    }
                },
                { $sort: { _id: 1 } }
            ]),

            // User locations
            User.aggregate([
                { $match: { location: { $ne: '' } } },
                { $group: { _id: '$location', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 15 }
            ]),

            // User activity (last login)
            User.aggregate([
                {
                    $group: {
                        _id: {
                            $cond: [
                                { $gte: ['$lastLoginAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
                                'active_7d',
                                {
                                    $cond: [
                                        { $gte: ['$lastLoginAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                                        'active_30d',
                                        'inactive'
                                    ]
                                }
                            ]
                        },
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                period,
                userGrowth,
                swapTrends,
                skillPopularity,
                reviewTrends,
                locationData,
                userActivity
            }
        });

    } catch (err) {
        console.error('Get analytics error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching analytics'
        });
    }
});

// Export data
router.get('/export/:type', adminAuth, [
    query('format').optional().isIn(['json', 'csv']),
    query('dateFrom').optional().isISO8601().toDate(),
    query('dateTo').optional().isISO8601().toDate()
], async (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'json', dateFrom, dateTo } = req.query;

        if (!['users', 'swaps', 'reviews'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid export type. Must be users, swaps, or reviews'
            });
        }

        let query = {};
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = dateFrom;
            if (dateTo) query.createdAt.$lte = dateTo;
        }

        let data;
        switch (type) {
            case 'users':
                data = await User.find(query)
                    .select('-password -passwordResetToken -passwordResetExpires -emailVerificationToken -emailVerificationExpires')
                    .lean();
                break;
            case 'swaps':
                data = await SwapRequest.find(query)
                    .populate('requester', 'name email')
                    .populate('recipient', 'name email')
                    .lean();
                break;
            case 'reviews':
                data = await Review.find(query)
                    .populate('reviewer', 'name email')
                    .populate('reviewee', 'name email')
                    .lean();
                break;
        }

        if (format === 'csv') {
            // For CSV format, you might want to use a CSV library
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${type}_export.csv`);
            // Implement CSV conversion here
            res.json({ message: 'CSV export not implemented yet' });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=${type}_export.json`);
            res.json({
                success: true,
                exportDate: new Date().toISOString(),
                type,
                count: data.length,
                data
            });
        }

    } catch (err) {
        console.error('Export data error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while exporting data'
        });
    }
});

// Ban/Unban user
router.put('/users/:userId/ban', adminAuth, [
    body('isBanned').isBoolean().withMessage('isBanned must be a boolean'),
    body('banReason').optional().trim().isLength({ max: 500 }).withMessage('Ban reason cannot exceed 500 characters')
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
        const { isBanned, banReason } = req.body;

        // Don't allow admin to ban themselves
        if (userId === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot ban your own account'
            });
        }

        const updateData = {
            isActive: !isBanned,
            banReason: isBanned ? banReason : null,
            bannedAt: isBanned ? new Date() : null,
            bannedBy: isBanned ? req.user.id : null
        };

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
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
            message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`,
            data: { user }
        });

    } catch (err) {
        console.error('Admin ban user error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while updating user ban status'
        });
    }
});

// Moderate skill descriptions
router.put('/users/:userId/skills/moderate', adminAuth, [
    body('skillsOffered').optional().isArray().withMessage('skillsOffered must be an array'),
    body('skillsWanted').optional().isArray().withMessage('skillsWanted must be an array'),
    body('moderationNote').optional().trim().isLength({ max: 500 }).withMessage('Moderation note cannot exceed 500 characters')
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
        const { skillsOffered, skillsWanted, moderationNote } = req.body;

        const updateData = {};
        if (skillsOffered !== undefined) updateData.skillsOffered = skillsOffered;
        if (skillsWanted !== undefined) updateData.skillsWanted = skillsWanted;
        if (moderationNote) {
            updateData.moderationHistory = {
                $push: {
                    date: new Date(),
                    moderator: req.user.id,
                    note: moderationNote,
                    action: 'skills_moderated'
                }
            };
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updateData.moderationHistory ? 
                { $set: { skillsOffered, skillsWanted }, ...updateData } : 
                { $set: updateData },
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
            message: 'User skills moderated successfully',
            data: { user }
        });

    } catch (err) {
        console.error('Admin moderate skills error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while moderating skills'
        });
    }
});

// Send platform-wide message
router.post('/messages/broadcast', adminAuth, [
    body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
    body('message').trim().isLength({ min: 1, max: 2000 }).withMessage('Message must be between 1 and 2000 characters'),
    body('type').isIn(['info', 'warning', 'maintenance', 'feature']).withMessage('Invalid message type'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
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

        const { title, message, type, priority = 'medium' } = req.body;

        // Create a system message (you might want to create a Message model for this)
        const broadcastMessage = {
            title,
            message,
            type,
            priority,
            sentBy: req.user.id,
            sentAt: new Date(),
            isActive: true
        };

        // For now, we'll add this to all users' notification arrays
        // In a real app, you might want a separate notifications/messages collection
        await User.updateMany(
            { isActive: true },
            {
                $push: {
                    notifications: {
                        ...broadcastMessage,
                        read: false,
                        receivedAt: new Date()
                    }
                }
            }
        );

        res.json({
            success: true,
            message: 'Broadcast message sent successfully',
            data: { broadcastMessage }
        });

    } catch (err) {
        console.error('Admin broadcast message error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while sending broadcast message'
        });
    }
});

// Get detailed swap monitoring data
router.get('/swaps/monitor', adminAuth, [
    query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
    query('flagged').optional().isBoolean().toBoolean(),
    query('overdue').optional().isBoolean().toBoolean(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt()
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
            status,
            priority,
            flagged,
            overdue,
            page = 1,
            limit = 25
        } = req.query;

        let query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        if (typeof flagged === 'boolean') query.isFlagged = flagged;

        // Handle overdue logic
        if (overdue) {
            const overdueDate = new Date();
            overdueDate.setDate(overdueDate.getDate() - 7); // 7 days overdue
            query.createdAt = { $lt: overdueDate };
            query.status = { $in: ['pending', 'accepted'] };
        }

        const skip = (page - 1) * limit;

        const [swaps, totalCount, statusCounts, priorityCounts] = await Promise.all([
            SwapRequest.find(query)
                .populate('requester', 'name email avatar rating isActive')
                .populate('recipient', 'name email avatar rating isActive')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            
            SwapRequest.countDocuments(query),
            
            // Get status distribution
            SwapRequest.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            
            // Get priority distribution
            SwapRequest.aggregate([
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ])
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            success: true,
            data: {
                swaps,
                pagination: {
                    current: page,
                    pages: totalPages,
                    total: totalCount,
                    limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                },
                statistics: {
                    statusCounts,
                    priorityCounts,
                    totalActive: swaps.filter(s => ['pending', 'accepted'].includes(s.status)).length,
                    totalFlagged: swaps.filter(s => s.isFlagged).length
                }
            }
        });

    } catch (err) {
        console.error('Admin swap monitoring error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching swap monitoring data'
        });
    }
});

// Enhanced export with more detailed reports
router.get('/reports/:reportType', adminAuth, [
    query('format').optional().isIn(['json', 'csv']),
    query('dateFrom').optional().isISO8601().toDate(),
    query('dateTo').optional().isISO8601().toDate(),
    query('includeInactive').optional().isBoolean().toBoolean()
], async (req, res) => {
    try {
        const { reportType } = req.params;
        const { format = 'json', dateFrom, dateTo, includeInactive = false } = req.query;

        if (!['user-activity', 'feedback-logs', 'swap-stats', 'moderation-log'].includes(reportType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report type. Must be user-activity, feedback-logs, swap-stats, or moderation-log'
            });
        }

        let query = {};
        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = dateFrom;
            if (dateTo) query.createdAt.$lte = dateTo;
        }

        let data;
        let reportData = {};

        switch (reportType) {
            case 'user-activity':
                if (!includeInactive) query.isActive = true;
                data = await User.find(query)
                    .select('name email role isActive lastLoginAt createdAt stats')
                    .lean();
                reportData = {
                    totalUsers: data.length,
                    activeUsers: data.filter(u => u.isActive).length,
                    adminUsers: data.filter(u => u.role === 'admin').length,
                    users: data
                };
                break;

            case 'feedback-logs':
                data = await Review.find(query)
                    .populate('reviewer', 'name email')
                    .populate('reviewee', 'name email')
                    .populate('swapRequest', 'skillOffered skillWanted status')
                    .lean();
                reportData = {
                    totalReviews: data.length,
                    averageRating: data.reduce((acc, r) => acc + r.rating.overall, 0) / data.length || 0,
                    reviews: data
                };
                break;

            case 'swap-stats':
                data = await SwapRequest.find(query)
                    .populate('requester', 'name email')
                    .populate('recipient', 'name email')
                    .lean();
                
                const statusBreakdown = data.reduce((acc, swap) => {
                    acc[swap.status] = (acc[swap.status] || 0) + 1;
                    return acc;
                }, {});

                reportData = {
                    totalSwaps: data.length,
                    statusBreakdown,
                    successRate: data.length > 0 ? 
                        Math.round((statusBreakdown.completed || 0) / data.length * 100) : 0,
                    swaps: data
                };
                break;

            case 'moderation-log':
                // This would require a moderation log collection or field
                // For now, we'll return banned users and moderated content
                const bannedUsers = await User.find({ 
                    isActive: false, 
                    banReason: { $exists: true },
                    ...query 
                }).select('name email banReason bannedAt bannedBy').lean();
                
                reportData = {
                    totalModerationActions: bannedUsers.length,
                    bannedUsers,
                    // Add more moderation data as needed
                };
                break;
        }

        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${reportType}_report.csv`);
            // Implement CSV conversion here
            res.json({ message: 'CSV export not implemented yet', data: reportData });
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=${reportType}_report.json`);
            res.json({
                success: true,
                reportType,
                generatedAt: new Date().toISOString(),
                dateRange: { from: dateFrom, to: dateTo },
                ...reportData
            });
        }

    } catch (err) {
        console.error('Generate report error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while generating report'
        });
    }
});

module.exports = router;