const mongoose = require('mongoose');

// Define the swap request schema
const swapRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Requester is required']
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Recipient is required']
    },
    skillOffered: {
        type: String,
        required: [true, 'Skill offered is required'],
        trim: true,
        maxlength: [100, 'Skill offered cannot exceed 100 characters']
    },
    skillWanted: {
        type: String,
        required: [true, 'Skill wanted is required'],
        trim: true,
        maxlength: [100, 'Skill wanted cannot exceed 100 characters']
    },
    message: {
        type: String,
        maxlength: [1000, 'Message cannot exceed 1000 characters'],
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
        default: 'pending'
    },
    learningMode: {
        type: String,
        enum: ['Online', 'In-Person', 'Both'],
        required: [true, 'Learning mode is required']
    },
    duration: {
        estimatedHours: {
            type: Number,
            min: [1, 'Duration must be at least 1 hour'],
            max: [100, 'Duration cannot exceed 100 hours'],
            required: [true, 'Estimated hours is required']
        },
        timeframe: {
            type: String,
            enum: ['1 week', '2 weeks', '1 month', '2 months', '3 months', 'Flexible'],
            default: 'Flexible'
        }
    },
    schedule: {
        proposedStartDate: {
            type: Date
        },
        preferredDays: [{
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        }],
        preferredTime: {
            type: String,
            enum: ['Morning', 'Afternoon', 'Evening', 'Flexible']
        }
    },
    meetingDetails: {
        location: {
            type: String,
            maxlength: [200, 'Location cannot exceed 200 characters']
        },
        meetingLink: {
            type: String,
            maxlength: [500, 'Meeting link cannot exceed 500 characters']
        },
        additionalNotes: {
            type: String,
            maxlength: [500, 'Additional notes cannot exceed 500 characters']
        }
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    responseBy: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    },
    acceptedAt: Date,
    rejectedAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    feedback: {
        requesterFeedback: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comment: {
                type: String,
                maxlength: [500, 'Feedback comment cannot exceed 500 characters']
            },
            submittedAt: Date
        },
        recipientFeedback: {
            rating: {
                type: Number,
                min: 1,
                max: 5
            },
            comment: {
                type: String,
                maxlength: [500, 'Feedback comment cannot exceed 500 characters']
            },
            submittedAt: Date
        }
    },
    tags: [{
        type: String,
        trim: true,
        maxlength: [30, 'Tag cannot exceed 30 characters']
    }],
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
swapRequestSchema.index({ requester: 1, status: 1 });
swapRequestSchema.index({ recipient: 1, status: 1 });
swapRequestSchema.index({ status: 1, createdAt: -1 });
swapRequestSchema.index({ skillOffered: 1 });
swapRequestSchema.index({ skillWanted: 1 });
swapRequestSchema.index({ responseBy: 1 });

// Virtual for checking if request is expired
swapRequestSchema.virtual('isExpired').get(function() {
    return this.status === 'pending' && this.responseBy < new Date();
});

// Virtual for getting total feedback rating
swapRequestSchema.virtual('averageRating').get(function() {
    const ratings = [];
    if (this.feedback.requesterFeedback.rating) {
        ratings.push(this.feedback.requesterFeedback.rating);
    }
    if (this.feedback.recipientFeedback.rating) {
        ratings.push(this.feedback.recipientFeedback.rating);
    }
    
    if (ratings.length === 0) return null;
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
});

// Instance method to check if user can modify this request
swapRequestSchema.methods.canModify = function(userId) {
    return (this.requester.toString() === userId.toString() || 
            this.recipient.toString() === userId.toString()) &&
           ['pending', 'accepted'].includes(this.status);
};

// Instance method to check if request can be accepted
swapRequestSchema.methods.canAccept = function(userId) {
    return this.recipient.toString() === userId.toString() &&
           this.status === 'pending' &&
           !this.isExpired;
};

// Instance method to check if request can be rejected
swapRequestSchema.methods.canReject = function(userId) {
    return this.recipient.toString() === userId.toString() &&
           this.status === 'pending';
};

// Instance method to check if request can be cancelled
swapRequestSchema.methods.canCancel = function(userId) {
    return this.requester.toString() === userId.toString() &&
           ['pending', 'accepted'].includes(this.status);
};

// Instance method to check if request can be completed
swapRequestSchema.methods.canComplete = function(userId) {
    return (this.requester.toString() === userId.toString() || 
            this.recipient.toString() === userId.toString()) &&
           this.status === 'accepted';
};

// Static method to get user's request statistics
swapRequestSchema.statics.getUserStats = function(userId) {
    return this.aggregate([
        {
            $match: {
                $or: [
                    { requester: mongoose.Types.ObjectId(userId) },
                    { recipient: mongoose.Types.ObjectId(userId) }
                ]
            }
        },
        {
            $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                pendingRequests: {
                    $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                },
                acceptedRequests: {
                    $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
                },
                completedRequests: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                rejectedRequests: {
                    $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
                },
                cancelledRequests: {
                    $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                }
            }
        }
    ]);
};

// Ensure virtual fields are serialized
swapRequestSchema.set('toJSON', { virtuals: true });
swapRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SwapRequest', swapRequestSchema);