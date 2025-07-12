const express = require('express');
const { body, validationResult, query } = require('express-validator');
const SwapRequest = require('../models/SwapRequest');
const Review = require('../models/Review');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');
const router = express.Router();

// Get all swap requests (with filters)
router.get('/', auth, [
    query('status').optional().isIn(['pending', 'accepted', 'rejected', 'completed', 'cancelled']),
    query('skillOffered').optional().trim().escape(),
    query('skillWanted').optional().trim().escape(),
    query('learningMode').optional().isIn(['Online', 'In-Person', 'Both']),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
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
            skillOffered,
            skillWanted,
            learningMode,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query - user can see requests they're involved in
        let query = {
            $or: [
                { requester: req.user.id },
                { recipient: req.user.id }
            ]
        };

        if (status) {
            query.status = status;
        }

        if (skillOffered) {
            query.skillOffered = { $regex: skillOffered, $options: 'i' };
        }

        if (skillWanted) {
            query.skillWanted = { $regex: skillWanted, $options: 'i' };
        }

        if (learningMode) {
            query.learningMode = learningMode;
        }

        // Sorting
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const skip = (page - 1) * limit;

        const swaps = await SwapRequest.find(query)
            .populate('requester', 'name avatar rating location')
            .populate('recipient', 'name avatar rating location')
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
        console.error('Get swap requests error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching swap requests'
        });
    }
});

// Create new swap request
router.post('/', auth, [
    body('recipient')
        .notEmpty()
        .isMongoId()
        .withMessage('Valid recipient ID is required'),
    body('skillOffered')
        .trim()
        .notEmpty()
        .isLength({ max: 100 })
        .withMessage('Skill offered is required and cannot exceed 100 characters'),
    body('skillWanted')
        .trim()
        .notEmpty()
        .isLength({ max: 100 })
        .withMessage('Skill wanted is required and cannot exceed 100 characters'),
    body('message')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Message cannot exceed 1000 characters'),
    body('learningMode')
        .isIn(['Online', 'In-Person', 'Both'])
        .withMessage('Valid learning mode is required'),
    body('duration.estimatedHours')
        .isInt({ min: 1, max: 100 })
        .withMessage('Estimated hours must be between 1 and 100'),
    body('duration.timeframe')
        .optional()
        .isIn(['1 week', '2 weeks', '1 month', '2 months', '3 months', 'Flexible'])
        .withMessage('Invalid timeframe'),
    body('schedule.preferredDays')
        .optional()
        .isArray()
        .withMessage('Preferred days must be an array'),
    body('schedule.preferredTime')
        .optional()
        .isIn(['Morning', 'Afternoon', 'Evening', 'Flexible'])
        .withMessage('Invalid preferred time'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Invalid priority level')
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

        const {
            recipient,
            skillOffered,
            skillWanted,
            message = '',
            learningMode,
            duration,
            schedule = {},
            meetingDetails = {},
            priority = 'medium',
            tags = []
        } = req.body;

        // Check if recipient exists and is active
        const recipientUser = await User.findById(recipient);
        if (!recipientUser || !recipientUser.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Recipient not found or inactive'
            });
        }

        // Prevent sending request to self
        if (req.user.id === recipient) {
            return res.status(400).json({
                success: false,
                message: 'Cannot send swap request to yourself'
            });
        }

        // Check if there's already a pending request between these users for the same skills
        const existingRequest = await SwapRequest.findOne({
            requester: req.user.id,
            recipient: recipient,
            skillOffered: skillOffered,
            skillWanted: skillWanted,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending request for these skills with this user'
            });
        }

        // Check if recipient has the wanted skill and wants the offered skill
        const hasWantedSkill = recipientUser.skillsOffered.some(skill => 
            skill.toLowerCase().includes(skillWanted.toLowerCase())
        );
        const wantsOfferedSkill = recipientUser.skillsWanted.some(skill => 
            skill.toLowerCase().includes(skillOffered.toLowerCase())
        );

        if (!hasWantedSkill) {
            return res.status(400).json({
                success: false,
                message: `${recipientUser.name} doesn't offer the skill: ${skillWanted}`
            });
        }

        // Create new swap request
        const swapRequest = new SwapRequest({
            requester: req.user.id,
            recipient,
            skillOffered,
            skillWanted,
            message,
            learningMode,
            duration,
            schedule,
            meetingDetails,
            priority,
            tags
        });

        await swapRequest.save();

        // Populate the response
        await swapRequest.populate([
            { path: 'requester', select: 'name avatar rating location' },
            { path: 'recipient', select: 'name avatar rating location' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Swap request created successfully',
            data: { swapRequest }
        });

    } catch (err) {
        console.error('Create swap request error:', err);
        
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while creating swap request'
        });
    }
});

// Get specific swap request
router.get('/:swapId', auth, async (req, res) => {
    try {
        const { swapId } = req.params;

        const swapRequest = await SwapRequest.findById(swapId)
            .populate('requester', 'name avatar rating location skillsOffered skillsWanted')
            .populate('recipient', 'name avatar rating location skillsOffered skillsWanted');

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                message: 'Swap request not found'
            });
        }

        // Check if user is involved in this swap
        const isRequester = swapRequest.requester._id.toString() === req.user.id;
        const isRecipient = swapRequest.recipient._id.toString() === req.user.id;
        
        if (!isRequester && !isRecipient && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: { swapRequest }
        });

    } catch (err) {
        console.error('Get swap request error:', err);
        
        if (err.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid swap request ID'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error while fetching swap request'
        });
    }
});

// Accept swap request
router.put('/:swapId/accept', auth, [
    body('meetingDetails.location').optional().trim().isLength({ max: 200 }),
    body('meetingDetails.meetingLink').optional().trim().isURL(),
    body('meetingDetails.additionalNotes').optional().trim().isLength({ max: 500 })
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
        const { meetingDetails = {} } = req.body;

        const swapRequest = await SwapRequest.findById(swapId);

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                message: 'Swap request not found'
            });
        }

        if (!swapRequest.canAccept(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Cannot accept this request'
            });
        }

        // Update swap request
        swapRequest.status = 'accepted';
        swapRequest.acceptedAt = new Date();
        
        if (meetingDetails) {
            swapRequest.meetingDetails = { ...swapRequest.meetingDetails, ...meetingDetails };
        }

        await swapRequest.save();

        await swapRequest.populate([
            { path: 'requester', select: 'name avatar rating location' },
            { path: 'recipient', select: 'name avatar rating location' }
        ]);

        res.json({
            success: true,
            message: 'Swap request accepted successfully',
            data: { swapRequest }
        });

    } catch (err) {
        console.error('Accept swap request error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while accepting swap request'
        });
    }
});

// Reject swap request
router.put('/:swapId/reject', auth, [
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
    try {
        const { swapId } = req.params;
        const { reason } = req.body;

        const swapRequest = await SwapRequest.findById(swapId);

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                message: 'Swap request not found'
            });
        }

        if (!swapRequest.canReject(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Cannot reject this request'
            });
        }

        swapRequest.status = 'rejected';
        swapRequest.rejectedAt = new Date();
        
        if (reason) {
            swapRequest.cancellationReason = reason;
        }

        await swapRequest.save();

        await swapRequest.populate([
            { path: 'requester', select: 'name avatar rating location' },
            { path: 'recipient', select: 'name avatar rating location' }
        ]);

        res.json({
            success: true,
            message: 'Swap request rejected',
            data: { swapRequest }
        });

    } catch (err) {
        console.error('Reject swap request error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while rejecting swap request'
        });
    }
});

// Cancel swap request
router.put('/:swapId/cancel', auth, [
    body('reason').optional().trim().isLength({ max: 500 }).withMessage('Reason cannot exceed 500 characters')
], async (req, res) => {
    try {
        const { swapId } = req.params;
        const { reason } = req.body;

        const swapRequest = await SwapRequest.findById(swapId);

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                message: 'Swap request not found'
            });
        }

        if (!swapRequest.canCancel(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Cannot cancel this request'
            });
        }

        swapRequest.status = 'cancelled';
        swapRequest.cancelledAt = new Date();
        
        if (reason) {
            swapRequest.cancellationReason = reason;
        }

        await swapRequest.save();

        await swapRequest.populate([
            { path: 'requester', select: 'name avatar rating location' },
            { path: 'recipient', select: 'name avatar rating location' }
        ]);

        res.json({
            success: true,
            message: 'Swap request cancelled',
            data: { swapRequest }
        });

    } catch (err) {
        console.error('Cancel swap request error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while cancelling swap request'
        });
    }
});

// Mark swap as completed
router.put('/:swapId/complete', auth, async (req, res) => {
    try {
        const { swapId } = req.params;

        const swapRequest = await SwapRequest.findById(swapId);

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                message: 'Swap request not found'
            });
        }

        if (!swapRequest.canComplete(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Cannot mark this request as completed'
            });
        }

        swapRequest.status = 'completed';
        swapRequest.completedAt = new Date();

        await swapRequest.save();

        // Update user stats
        await Promise.all([
            User.findByIdAndUpdate(swapRequest.requester, {
                $inc: { 
                    'stats.totalSwaps': 1,
                    'stats.successfulSwaps': 1
                }
            }),
            User.findByIdAndUpdate(swapRequest.recipient, {
                $inc: { 
                    'stats.totalSwaps': 1,
                    'stats.successfulSwaps': 1
                }
            })
        ]);

        await swapRequest.populate([
            { path: 'requester', select: 'name avatar rating location' },
            { path: 'recipient', select: 'name avatar rating location' }
        ]);

        res.json({
            success: true,
            message: 'Swap marked as completed! You can now leave reviews.',
            data: { swapRequest }
        });

    } catch (err) {
        console.error('Complete swap request error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while completing swap request'
        });
    }
});

// Update swap request
router.put('/:swapId', auth, [
    body('message').optional().trim().isLength({ max: 1000 }),
    body('duration.estimatedHours').optional().isInt({ min: 1, max: 100 }),
    body('schedule.preferredDays').optional().isArray(),
    body('schedule.preferredTime').optional().isIn(['Morning', 'Afternoon', 'Evening', 'Flexible']),
    body('meetingDetails.location').optional().trim().isLength({ max: 200 }),
    body('meetingDetails.meetingLink').optional().trim().isURL(),
    body('meetingDetails.additionalNotes').optional().trim().isLength({ max: 500 }),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
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
        const updateData = req.body;

        const swapRequest = await SwapRequest.findById(swapId);

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                message: 'Swap request not found'
            });
        }

        if (!swapRequest.canModify(req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'Cannot modify this request'
            });
        }

        // Remove fields that shouldn't be updated
        delete updateData.requester;
        delete updateData.recipient;
        delete updateData.skillOffered;
        delete updateData.skillWanted;
        delete updateData.status;
        delete updateData.acceptedAt;
        delete updateData.rejectedAt;
        delete updateData.completedAt;
        delete updateData.cancelledAt;

        Object.assign(swapRequest, updateData);
        await swapRequest.save();

        await swapRequest.populate([
            { path: 'requester', select: 'name avatar rating location' },
            { path: 'recipient', select: 'name avatar rating location' }
        ]);

        res.json({
            success: true,
            message: 'Swap request updated successfully',
            data: { swapRequest }
        });

    } catch (err) {
        console.error('Update swap request error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while updating swap request'
        });
    }
});

// Delete swap request (only if pending and by requester)
router.delete('/:swapId', auth, async (req, res) => {
    try {
        const { swapId } = req.params;

        const swapRequest = await SwapRequest.findById(swapId);

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                message: 'Swap request not found'
            });
        }

        // Only requester can delete and only if pending
        if (swapRequest.requester.toString() !== req.user.id || swapRequest.status !== 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete this request'
            });
        }

        await SwapRequest.findByIdAndDelete(swapId);

        res.json({
            success: true,
            message: 'Swap request deleted successfully'
        });

    } catch (err) {
        console.error('Delete swap request error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting swap request'
        });
    }
});

// Submit review for completed swap
router.post('/:swapId/review', auth, [
    body('rating.overall')
        .isInt({ min: 1, max: 5 })
        .withMessage('Overall rating must be between 1 and 5'),
    body('rating.communication')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Communication rating must be between 1 and 5'),
    body('rating.knowledge')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Knowledge rating must be between 1 and 5'),
    body('rating.patience')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Patience rating must be between 1 and 5'),
    body('rating.helpfulness')
        .optional()
        .isInt({ min: 1, max: 5 })
        .withMessage('Helpfulness rating must be between 1 and 5'),
    body('comment')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Comment must be between 10 and 1000 characters'),
    body('wouldRecommend')
        .isBoolean()
        .withMessage('Recommendation status is required'),
    body('pros').optional().isArray(),
    body('improvements').optional().isArray(),
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

        const { swapId } = req.params;
        const {
            rating,
            comment,
            wouldRecommend,
            pros = [],
            improvements = [],
            isPublic = true,
            tags = []
        } = req.body;

        const swapRequest = await SwapRequest.findById(swapId);

        if (!swapRequest) {
            return res.status(404).json({
                success: false,
                message: 'Swap request not found'
            });
        }

        if (swapRequest.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Can only review completed swaps'
            });
        }

        // Determine reviewer and reviewee
        const isRequester = swapRequest.requester.toString() === req.user.id;
        const isRecipient = swapRequest.recipient.toString() === req.user.id;

        if (!isRequester && !isRecipient) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const reviewer = req.user.id;
        const reviewee = isRequester ? swapRequest.recipient : swapRequest.requester;
        const skillTaught = isRequester ? swapRequest.skillOffered : swapRequest.skillWanted;
        const skillLearned = isRequester ? swapRequest.skillWanted : swapRequest.skillOffered;

        // Check if review already exists
        const existingReview = await Review.findOne({
            reviewer,
            swapRequest: swapId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this swap'
            });
        }

        // Create review
        const review = new Review({
            reviewer,
            reviewee,
            swapRequest: swapId,
            skillTaught,
            skillLearned,
            rating,
            comment,
            wouldRecommend,
            pros,
            improvements,
            isPublic,
            tags
        });

        await review.save();

        await review.populate([
            { path: 'reviewer', select: 'name avatar' },
            { path: 'reviewee', select: 'name avatar' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: { review }
        });

    } catch (err) {
        console.error('Submit review error:', err);
        res.status(500).json({
            success: false,
            message: 'Server error while submitting review'
        });
    }
});

module.exports = router;