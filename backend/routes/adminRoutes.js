const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const SwapRequest = require('../models/SwapRequest');
const Review = require('../models/Review');
const { adminAuth } = require('../middleware/auth');
const router = express.Router();

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

module.exports = router;