const mongoose = require('mongoose');

// Define the review schema
const reviewSchema = new mongoose.Schema({
    reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reviewer is required']
    },
    reviewee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Reviewee is required']
    },
    swapRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SwapRequest',
        required: [true, 'Swap request is required']
    },
    skillTaught: {
        type: String,
        required: [true, 'Skill taught is required'],
        trim: true,
        maxlength: [100, 'Skill taught cannot exceed 100 characters']
    },
    skillLearned: {
        type: String,
        required: [true, 'Skill learned is required'],
        trim: true,
        maxlength: [100, 'Skill learned cannot exceed 100 characters']
    },
    rating: {
        overall: {
            type: Number,
            required: [true, 'Overall rating is required'],
            min: [1, 'Rating must be between 1 and 5'],
            max: [5, 'Rating must be between 1 and 5']
        },
        communication: {
            type: Number,
            min: [1, 'Communication rating must be between 1 and 5'],
            max: [5, 'Communication rating must be between 1 and 5'],
            default: 0
        },
        knowledge: {
            type: Number,
            min: [1, 'Knowledge rating must be between 1 and 5'],
            max: [5, 'Knowledge rating must be between 1 and 5'],
            default: 0
        },
        patience: {
            type: Number,
            min: [1, 'Patience rating must be between 1 and 5'],
            max: [5, 'Patience rating must be between 1 and 5'],
            default: 0
        },
        helpfulness: {
            type: Number,
            min: [1, 'Helpfulness rating must be between 1 and 5'],
            max: [5, 'Helpfulness rating must be between 1 and 5'],
            default: 0
        }
    },
    comment: {
        type: String,
        required: [true, 'Review comment is required'],
        trim: true,
        minlength: [10, 'Comment must be at least 10 characters long'],
        maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    pros: [{
        type: String,
        trim: true,
        maxlength: [200, 'Pro cannot exceed 200 characters']
    }],
    improvements: [{
        type: String,
        trim: true,
        maxlength: [200, 'Improvement suggestion cannot exceed 200 characters']
    }],
    wouldRecommend: {
        type: Boolean,
        required: [true, 'Recommendation status is required']
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: true // Set to true since it's based on completed swap
    },
    helpfulVotes: {
        type: Number,
        default: 0
    },
    reportCount: {
        type: Number,
        default: 0
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    response: {
        comment: {
            type: String,
            trim: true,
            maxlength: [500, 'Response cannot exceed 500 characters']
        },
        respondedAt: Date,
        isPublic: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true
});

// Indexes for better query performance
reviewSchema.index({ reviewer: 1 });
reviewSchema.index({ reviewee: 1 });
reviewSchema.index({ swapRequest: 1 });
reviewSchema.index({ 'rating.overall': -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isPublic: 1, isHidden: 1 });
reviewSchema.index({ skillTaught: 1 });
reviewSchema.index({ skillLearned: 1 });

// Compound index to prevent duplicate reviews for same swap
reviewSchema.index({ reviewer: 1, swapRequest: 1 }, { unique: true });

// Virtual for average detailed rating
reviewSchema.virtual('averageDetailedRating').get(function() {
    const ratings = [
        this.rating.communication,
        this.rating.knowledge,
        this.rating.patience,
        this.rating.helpfulness
    ].filter(rating => rating > 0);
    
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Virtual for checking if review is recent
reviewSchema.virtual('isRecent').get(function() {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.createdAt > oneMonthAgo;
});

// Instance method to check if user can edit this review
reviewSchema.methods.canEdit = function(userId) {
    const timeSinceCreation = Date.now() - this.createdAt.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    
    return this.reviewer.toString() === userId.toString() && 
           timeSinceCreation < twentyFourHours;
};

// Instance method to check if user can respond to this review
reviewSchema.methods.canRespond = function(userId) {
    return this.reviewee.toString() === userId.toString() && 
           !this.response.comment;
};

// Instance method to check if user can vote helpful
reviewSchema.methods.canVoteHelpful = function(userId) {
    return this.reviewer.toString() !== userId.toString() &&
           this.reviewee.toString() !== userId.toString();
};

// Static method to calculate user's average rating
reviewSchema.statics.getUserAverageRating = function(userId) {
    return this.aggregate([
        {
            $match: {
                reviewee: mongoose.Types.ObjectId(userId),
                isPublic: true,
                isHidden: false
            }
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating.overall' },
                totalReviews: { $sum: 1 },
                averageCommunication: { $avg: '$rating.communication' },
                averageKnowledge: { $avg: '$rating.knowledge' },
                averagePatience: { $avg: '$rating.patience' },
                averageHelpfulness: { $avg: '$rating.helpfulness' },
                recommendationRate: {
                    $avg: { $cond: ['$wouldRecommend', 1, 0] }
                }
            }
        }
    ]);
};

// Static method to get skill-specific ratings
reviewSchema.statics.getSkillRatings = function(userId, skill) {
    return this.aggregate([
        {
            $match: {
                reviewee: mongoose.Types.ObjectId(userId),
                skillTaught: skill,
                isPublic: true,
                isHidden: false
            }
        },
        {
            $group: {
                _id: skill,
                averageRating: { $avg: '$rating.overall' },
                totalReviews: { $sum: 1 },
                averageKnowledge: { $avg: '$rating.knowledge' },
                recommendationRate: {
                    $avg: { $cond: ['$wouldRecommend', 1, 0] }
                }
            }
        }
    ]);
};

// Static method to get review trends
reviewSchema.statics.getReviewTrends = function(userId, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    return this.aggregate([
        {
            $match: {
                reviewee: mongoose.Types.ObjectId(userId),
                createdAt: { $gte: startDate },
                isPublic: true,
                isHidden: false
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                averageRating: { $avg: '$rating.overall' },
                reviewCount: { $sum: 1 }
            }
        },
        {
            $sort: { '_id.year': 1, '_id.month': 1 }
        }
    ]);
};

// Pre-save middleware to update user's rating
reviewSchema.post('save', async function() {
    try {
        const User = mongoose.model('User');
        const result = await this.constructor.getUserAverageRating(this.reviewee);
        
        if (result.length > 0) {
            await User.findByIdAndUpdate(this.reviewee, {
                rating: Math.round(result[0].averageRating * 10) / 10,
                reviewsCount: result[0].totalReviews
            });
        }
    } catch (error) {
        console.error('Error updating user rating:', error);
    }
});

// Ensure virtual fields are serialized
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Review', reviewSchema);